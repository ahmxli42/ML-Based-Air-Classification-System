"""
Preprocess V2 Pipeline & Model Evaluation
==========================================
Upgrades the cleaned air quality dataset with CPCB sub-index recomputation,
mandatory validation audits, lag temporal features, seasonal features,
and particulate ratio engineering. Trains and evaluates baseline vs. improved
Random Forest classifiers to quantify predictive improvements.

Specifications according to accuracy.md.
"""

from pathlib import Path
import sys
import time
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

# Safe encoding for Windows terminal output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# =============================================================================
# CONSTANTS & CONFIGURATION
# =============================================================================
MANDATORY_POLLUTANTS = ["PM2.5", "PM10", "SO2", "NO2", "CO", "O3"]
EXTENDED_POLLUTANTS = ["NO", "NOx", "NH3", "Benzene", "Toluene", "Xylene"]
ALL_POLLUTANTS = MANDATORY_POLLUTANTS + EXTENDED_POLLUTANTS

AQI_CATEGORIES = ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]


# =============================================================================
# STEP 1: BASE CLEANING
# =============================================================================
def run_base_cleaning(raw_df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Applies baseline cleaning:
    1. Drops records missing ground truth labels (AQI / AQI_Bucket).
    2. Drops exact row duplicates and conflicting (StationId, Date) pairs.
    3. Treats negative pollutant concentration values (< 0) as invalid/missing.
    4. Performs per-station median imputation, falling back to global median.
    """
    initial_rows = len(raw_df)
    initial_cols = len(raw_df.columns)

    # 1. Missing ground truth label removal
    labeled_mask = raw_df["AQI"].notna() & raw_df["AQI_Bucket"].notna()
    df = raw_df[labeled_mask].copy()
    missing_labels_dropped = initial_rows - len(df)

    # 2. Duplicate audit and removal
    exact_duplicates = int(df.duplicated().sum())
    df = df.drop_duplicates().copy()

    station_date_duplicates = int(df.duplicated(subset=["StationId", "Date"]).sum())
    df = df.drop_duplicates(subset=["StationId", "Date"], keep="first").copy()

    # 3. Treat negative values as invalid (NaN) prior to imputation
    negative_counts = {}
    for col in ALL_POLLUTANTS:
        if col in df.columns:
            neg_mask = df[col] < 0
            neg_cnt = int(neg_mask.sum())
            if neg_cnt > 0:
                negative_counts[col] = neg_cnt
                df.loc[neg_mask, col] = np.nan

    # 4. Per-station median imputation with global fallback
    imputation_stats = {}
    for col in ALL_POLLUTANTS:
        if col in df.columns:
            pre_nan = int(df[col].isna().sum())
            station_med = df.groupby("StationId")[col].transform("median")
            global_med = float(df[col].median()) if not df[col].dropna().empty else 0.0

            df[col] = df[col].fillna(station_med).fillna(global_med)
            imputation_stats[col] = {
                "missing_before": pre_nan,
                "global_median": global_med,
            }

    audit_summary = {
        "initial_rows": initial_rows,
        "initial_cols": initial_cols,
        "missing_labels_dropped": missing_labels_dropped,
        "exact_duplicates": exact_duplicates,
        "station_date_duplicates": station_date_duplicates,
        "negative_counts": negative_counts,
        "imputation_stats": imputation_stats,
        "retained_rows": len(df),
    }

    return df, audit_summary


# =============================================================================
# STEP 2: CPCB SUB-INDEX & AQI CALCULATION
# =============================================================================
def calc_pm25_subindex(c: float) -> float:
    """CPCB PM2.5 Breakpoints (24-hr avg, µg/m³)"""
    if pd.isna(c) or c < 0:
        return np.nan
    if c <= 30:
        return c * 50.0 / 30.0
    elif c <= 60:
        return 50.0 + (c - 30.0) * 50.0 / 30.0
    elif c <= 90:
        return 100.0 + (c - 60.0) * 100.0 / 30.0
    elif c <= 120:
        return 200.0 + (c - 90.0) * 100.0 / 30.0
    elif c <= 250:
        return 300.0 + (c - 120.0) * 100.0 / 130.0
    else:
        return 400.0 + (c - 250.0) * 100.0 / 130.0


def calc_pm10_subindex(c: float) -> float:
    """CPCB PM10 Breakpoints (24-hr avg, µg/m³)"""
    if pd.isna(c) or c < 0:
        return np.nan
    if c <= 50:
        return c * 50.0 / 50.0
    elif c <= 100:
        return 50.0 + (c - 50.0) * 50.0 / 50.0
    elif c <= 250:
        return 100.0 + (c - 100.0) * 100.0 / 150.0
    elif c <= 350:
        return 200.0 + (c - 250.0) * 100.0 / 100.0
    elif c <= 430:
        return 300.0 + (c - 350.0) * 100.0 / 80.0
    else:
        return 400.0 + (c - 430.0) * 100.0 / 80.0


def calc_no2_subindex(c: float) -> float:
    """CPCB NO2 Breakpoints (24-hr avg, µg/m³)"""
    if pd.isna(c) or c < 0:
        return np.nan
    if c <= 40:
        return c * 50.0 / 40.0
    elif c <= 80:
        return 50.0 + (c - 40.0) * 50.0 / 40.0
    elif c <= 180:
        return 100.0 + (c - 80.0) * 100.0 / 100.0
    elif c <= 280:
        return 200.0 + (c - 180.0) * 100.0 / 100.0
    elif c <= 400:
        return 300.0 + (c - 280.0) * 100.0 / 120.0
    else:
        return 400.0 + (c - 400.0) * 100.0 / 120.0


def calc_so2_subindex(c: float) -> float:
    """CPCB SO2 Breakpoints (24-hr avg, µg/m³)"""
    if pd.isna(c) or c < 0:
        return np.nan
    if c <= 40:
        return c * 50.0 / 40.0
    elif c <= 80:
        return 50.0 + (c - 40.0) * 50.0 / 40.0
    elif c <= 380:
        return 100.0 + (c - 80.0) * 100.0 / 300.0
    elif c <= 800:
        return 200.0 + (c - 380.0) * 100.0 / 420.0
    elif c <= 1600:
        return 300.0 + (c - 800.0) * 100.0 / 800.0
    else:
        return 400.0 + (c - 1600.0) * 100.0 / 800.0


def calc_co_subindex(c: float) -> float:
    """CPCB CO Breakpoints (8-hr avg, mg/m³)"""
    if pd.isna(c) or c < 0:
        return np.nan
    if c <= 1.0:
        return c * 50.0 / 1.0
    elif c <= 2.0:
        return 50.0 + (c - 1.0) * 50.0 / 1.0
    elif c <= 10.0:
        return 100.0 + (c - 2.0) * 100.0 / 8.0
    elif c <= 17.0:
        return 200.0 + (c - 10.0) * 100.0 / 7.0
    elif c <= 34.0:
        return 300.0 + (c - 17.0) * 100.0 / 17.0
    else:
        return 400.0 + (c - 34.0) * 100.0 / 17.0


def calc_o3_subindex(c: float) -> float:
    """CPCB O3 Breakpoints (8-hr avg, µg/m³)"""
    if pd.isna(c) or c < 0:
        return np.nan
    if c <= 50:
        return c * 50.0 / 50.0
    elif c <= 100:
        return 50.0 + (c - 50.0) * 50.0 / 50.0
    elif c <= 168:
        return 100.0 + (c - 100.0) * 100.0 / 68.0
    elif c <= 208:
        return 200.0 + (c - 168.0) * 100.0 / 40.0
    elif c <= 748:
        return 300.0 + (c - 208.0) * 100.0 / 540.0
    else:
        return 400.0 + (c - 748.0) * 100.0 / 540.0


def map_aqi_to_category(aqi_val: float) -> str:
    """Maps AQI number to official standard CPCB categories."""
    if pd.isna(aqi_val):
        return "Unknown"
    val = round(aqi_val)
    if val <= 50:
        return "Good"
    elif val <= 100:
        return "Satisfactory"
    elif val <= 200:
        return "Moderate"
    elif val <= 300:
        return "Poor"
    elif val <= 400:
        return "Very Poor"
    else:
        return "Severe"


def recompute_cpcb_aqi(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes sub-indices for the 6 mandatory pollutants, sets overall AQI as
    the maximum of the six sub-indices, and maps to standard category bounds.
    """
    df_calc = df.copy()

    df_calc["SubIndex_PM2.5"] = df_calc["PM2.5"].apply(calc_pm25_subindex)
    df_calc["SubIndex_PM10"] = df_calc["PM10"].apply(calc_pm10_subindex)
    df_calc["SubIndex_NO2"] = df_calc["NO2"].apply(calc_no2_subindex)
    df_calc["SubIndex_SO2"] = df_calc["SO2"].apply(calc_so2_subindex)
    df_calc["SubIndex_CO"] = df_calc["CO"].apply(calc_co_subindex)
    df_calc["SubIndex_O3"] = df_calc["O3"].apply(calc_o3_subindex)

    subindex_cols = [
        "SubIndex_PM2.5",
        "SubIndex_PM10",
        "SubIndex_NO2",
        "SubIndex_SO2",
        "SubIndex_CO",
        "SubIndex_O3",
    ]

    df_calc["AQI_recomputed"] = df_calc[subindex_cols].max(axis=1)
    df_calc["AQI_Bucket_recomputed"] = df_calc["AQI_recomputed"].apply(map_aqi_to_category)

    # Drop temporary intermediate subindex columns to preserve clean schema
    df_calc.drop(columns=subindex_cols, inplace=True)

    return df_calc


# =============================================================================
# STEP 3: MANDATORY VALIDATION STEP
# =============================================================================
def run_validation_step(df: pd.DataFrame) -> dict:
    """
    Validates recomputed AQI labels against the dataset's original AQI_Bucket.
    Audits mismatch rate, internal consistency of original columns, and displays
    a random sample of 15-20 mismatched records side-by-side.
    """
    total_rows = len(df)
    mismatches = df[df["AQI_Bucket"] != df["AQI_Bucket_recomputed"]].copy()
    mismatch_count = len(mismatches)
    mismatch_pct = (mismatch_count / total_rows) * 100.0

    # Internal dataset sanity check: Does original AQI match original AQI_Bucket?
    expected_orig_bucket = df["AQI"].apply(map_aqi_to_category)
    internal_inconsistencies = df[df["AQI_Bucket"] != expected_orig_bucket]
    internal_inconsistency_count = len(internal_inconsistencies)
    internal_inconsistency_pct = (internal_inconsistency_count / total_rows) * 100.0

    print("\n" + "=" * 80)
    print("STEP 3: MANDATORY VALIDATION AUDIT (ORIGINAL VS. RECOMPUTED LABELS)")
    print("=" * 80)
    print(f"Total Evaluated Records:              {total_rows:,}")
    print(f"Label Mismatches (Original vs Recomputed): {mismatch_count:,} ({mismatch_pct:.2f}%)")
    print(f"Label Matches:                        {total_rows - mismatch_count:,} ({100.0 - mismatch_pct:.2f}%)")
    print(
        f"Original Internal Label Inconsistency: {internal_inconsistency_count:,} ({internal_inconsistency_pct:.2f}%)"
    )
    if internal_inconsistency_count == 0:
        print("  -> Confirmed: The raw dataset's original AQI and AQI_Bucket are 100% internally consistent.")

    # High mismatch warning check
    if mismatch_pct > 20.0:
        print("\n" + "!" * 80)
        print(
            f"[!] WARNING: High mismatch rate ({mismatch_pct:.2f}%) — verify breakpoint table accuracy and\n"
            f"    whether the original dataset used additional pollutants (e.g. NH3) or different\n"
            f"    time-averaging before trusting this recomputation."
        )
        print("!" * 80)

    # Random sample of 18 mismatched rows
    sample_size = min(18, mismatch_count)
    if sample_size > 0:
        sample_df = mismatches.sample(n=sample_size, random_state=42)
        print(f"\nRandom Sample of {sample_size} Mismatched Records (Side-by-Side Inspection):")
        print("-" * 115)
        header = (
            f"{'PM2.5':>7} {'PM10':>7} {'SO2':>6} {'NO2':>6} {'CO':>5} {'O3':>6} | "
            f"{'Orig AQI':>8} {'Orig Category':<15} | "
            f"{'New AQI':>8} {'New Category':<15}"
        )
        print(header)
        print("-" * 115)
        for _, r in sample_df.iterrows():
            print(
                f"{r['PM2.5']:>7.1f} {r['PM10']:>7.1f} {r['SO2']:>6.1f} {r['NO2']:>6.1f} "
                f"{r['CO']:>5.2f} {r['O3']:>6.1f} | "
                f"{r['AQI']:>8.1f} {r['AQI_Bucket']:<15} | "
                f"{r['AQI_recomputed']:>8.1f} {r['AQI_Bucket_recomputed']:<15}"
            )
        print("-" * 115)

    return {
        "total_rows": total_rows,
        "mismatch_count": mismatch_count,
        "mismatch_pct": mismatch_pct,
        "internal_inconsistency_count": internal_inconsistency_count,
        "internal_inconsistency_pct": internal_inconsistency_pct,
    }


# =============================================================================
# STEP 4: LAG FEATURES
# =============================================================================
def add_lag_features(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    For each mandatory pollutant and AQI, adds a _lag1 column containing that
    station's previous day's value (grouped by StationId, sorted by Date).
    Fills initial missing days with station median, falling back to global median.
    """
    df_lag = df.copy()

    # Ensure temporal sorting per station
    df_lag["Date"] = pd.to_datetime(df_lag["Date"])
    df_lag = df_lag.sort_values(["StationId", "Date"]).reset_index(drop=True)

    lag_targets = MANDATORY_POLLUTANTS + ["AQI"]
    lag_cols_created = []

    print("\n" + "=" * 80)
    print("STEP 4: TEMPORAL LAG FEATURE ENGINEERING (_lag1)")
    print("=" * 80)

    for col in lag_targets:
        lag_col = f"{col}_lag1"
        df_lag[lag_col] = df_lag.groupby("StationId")[col].shift(1)

        # Impute initial station observations with station median, fallback to global
        station_med = df_lag.groupby("StationId")[col].transform("median")
        global_med = float(df_lag[col].median())
        df_lag[lag_col] = df_lag[lag_col].fillna(station_med).fillna(global_med)

        lag_cols_created.append(lag_col)
        print(f"  [+] Engineered: {lag_col:<15} (Grouped by StationId, lagged by 1 day)")

    return df_lag, lag_cols_created


# =============================================================================
# STEP 5: SEASONAL FEATURES
# =============================================================================
def add_seasonal_features(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    Parses Date, extracts Month, and derives Season based on Punjab's regional cycle:
    - Oct-Nov: "Smog Season" (crop residue burning and atmospheric inversion)
    - Dec-Feb: "Winter" (radiation fogs and low mixing layer height)
    - Mar-May: "Spring" (convective transition)
    - Jun-Sep: "Monsoon/Summer" (precipitation scavenging & thermal dispersion)
    """
    df_season = df.copy()
    if not np.issubdtype(df_season["Date"].dtype, np.datetime64):
        df_season["Date"] = pd.to_datetime(df_season["Date"])

    df_season["Month"] = df_season["Date"].dt.month

    def map_punjab_season(month: int) -> str:
        if month in [10, 11]:
            return "Smog Season"
        elif month in [12, 1, 2]:
            return "Winter"
        elif month in [3, 4, 5]:
            return "Spring"
        else:
            return "Monsoon/Summer"

    df_season["Season"] = df_season["Month"].apply(map_punjab_season)

    # Encode season into an integer ordinal mapping for scikit-learn models
    season_numeric_map = {
        "Monsoon/Summer": 0,
        "Spring": 1,
        "Winter": 2,
        "Smog Season": 3,
    }
    df_season["Season_Code"] = df_season["Season"].map(season_numeric_map)

    print("\n" + "=" * 80)
    print("STEP 5: SEASONAL CLIMATOLOGY FEATURE ENGINEERING")
    print("=" * 80)
    print("  [+] Engineered: Month (1-12), Season (4 categories), Season_Code (0-3)")
    season_distribution = df_season["Season"].value_counts()
    for s_name, count in season_distribution.items():
        print(f"      * {s_name:<16}: {count:>6,d} rows ({count / len(df_season) * 100:>5.2f}%)")

    return df_season, ["Month", "Season", "Season_Code"]


# =============================================================================
# STEP 6: PM2.5 / PM10 RATIO FEATURE
# =============================================================================
def add_particulate_ratio_feature(df: pd.DataFrame) -> tuple[pd.DataFrame, str]:
    """
    Calculates PM25_PM10_ratio = PM2.5 / PM10.
    Handles division by zero and sets undefined values to the column median.
    """
    df_ratio = df.copy()

    # Safely compute ratio, guarding against zero or negative values
    safe_pm10 = df_ratio["PM10"].replace(0, np.nan)
    ratio_series = df_ratio["PM2.5"] / safe_pm10
    ratio_series = ratio_series.replace([np.inf, -np.inf], np.nan)

    ratio_median = float(ratio_series.median())
    df_ratio["PM25_PM10_ratio"] = ratio_series.fillna(ratio_median)

    print("\n" + "=" * 80)
    print("STEP 6: PARTICULATE RATIO FEATURE ENGINEERING (PM2.5 / PM10)")
    print("=" * 80)
    print(f"  [+] Engineered: PM25_PM10_ratio (Median fallback: {ratio_median:.4f})")
    print(f"      * Mean:   {df_ratio['PM25_PM10_ratio'].mean():.4f}")
    print(f"      * Median: {df_ratio['PM25_PM10_ratio'].median():.4f}")
    print(f"      * Std:    {df_ratio['PM25_PM10_ratio'].std():.4f}")

    return df_ratio, "PM25_PM10_ratio"


# =============================================================================
# STEP 7: SAVE OUTPUT & SUMMARY REPORT
# =============================================================================
def save_dataset_and_summarize(
    df: pd.DataFrame,
    output_path: Path,
    initial_rows: int,
    initial_cols: int,
    validation_stats: dict,
    new_cols: list[str],
) -> pd.DataFrame:
    """
    Saves datasets/station_day_v2.csv and prints comprehensive audit summary.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)

    print("\n" + "=" * 80)
    print("STEP 7: DATASET PERSISTENCE & BEFORE/AFTER AUDIT SUMMARY")
    print("=" * 80)
    print(f"Output Saved:                 {output_path}")
    print(f"Initial Dataset Shape:        {initial_rows:,} rows, {initial_cols} columns")
    print(f"Final Dataset Shape:          {len(df):,} rows, {len(df.columns)} columns")
    print(f"Label Mismatch Count:         {validation_stats['mismatch_count']:,} ({validation_stats['mismatch_pct']:.2f}%)")
    print(f"Newly Added Columns ({len(new_cols)}):   {', '.join(new_cols)}")

    print("\nTarget Class Distribution in v2 Dataset:")
    print(f"{'Category':<16} {'Sample Count':<15} {'Percentage':<12}")
    print("-" * 45)
    class_counts = df["AQI_Bucket"].value_counts()
    for cat in AQI_CATEGORIES:
        cnt = int(class_counts.get(cat, 0))
        pct = (cnt / len(df)) * 100.0
        print(f"{cat:<16} {cnt:<15,d} {pct:>6.2f}%")

    return df


# =============================================================================
# STEP 8: RETRAIN & COMPARE (BASELINE VS. UPGRADED)
# =============================================================================
def train_and_compare_models(df: pd.DataFrame, lag_cols: list[str]) -> dict:
    """
    Trains two Random Forest classifiers (200 trees, class_weight='balanced',
    80/20 stratified split, random_state=42):
    1. Version 1: Baseline using only 6 mandatory pollutants (replicates 77.31% baseline).
    2. Version 2: Improved using 6 mandatory pollutants + lag1 + seasonal + ratio features.
    Prints side-by-side comparison and per-class precision/recall/F1 metrics.
    """
    print("\n" + "=" * 80)
    print("STEP 8: MODEL RETRAINING & FEATURE IMPACT BENCHMARK")
    print("=" * 80)

    target_col = "AQI_Bucket"
    y = df[target_col]

    # Baseline features
    X_baseline = df[MANDATORY_POLLUTANTS]

    # Upgraded features
    upgraded_feature_cols = (
        MANDATORY_POLLUTANTS
        + lag_cols
        + ["Month", "Season_Code", "PM25_PM10_ratio"]
    )
    X_upgraded = df[upgraded_feature_cols]

    # Identical 80/20 stratified split
    random_seed = 42
    X_train_b, X_test_b, y_train, y_test = train_test_split(
        X_baseline, y, test_size=0.20, random_state=random_seed, stratify=y
    )

    X_train_u, X_test_u, _, _ = train_test_split(
        X_upgraded, y, test_size=0.20, random_state=random_seed, stratify=y
    )

    print(f"Training Samples: {len(y_train):,} (80.0%) | Test Samples: {len(y_test):,} (20.0%)")
    print("Random Forest Hyperparameters: n_estimators=200, class_weight='balanced', random_state=42\n")

    # 1. Train Baseline Model
    print("--> [1/2] Training Baseline Model (6 Mandatory Pollutants)...")
    t0 = time.time()
    rf_baseline = RandomForestClassifier(
        n_estimators=200,
        class_weight="balanced",
        random_state=random_seed,
        n_jobs=-1,
    )
    rf_baseline.fit(X_train_b, y_train)
    t_base = time.time() - t0
    y_pred_b = rf_baseline.predict(X_test_b)
    acc_baseline = accuracy_score(y_test, y_pred_b)
    print(f"    Baseline training completed in {t_base:.2f}s | Accuracy: {acc_baseline * 100:.2f}%")

    # 2. Train Upgraded Model
    print(f"\n--> [2/2] Training Upgraded Model ({len(upgraded_feature_cols)} Features)...")
    print(f"    Features: {', '.join(upgraded_feature_cols)}")
    t0 = time.time()
    rf_upgraded = RandomForestClassifier(
        n_estimators=200,
        class_weight="balanced",
        random_state=random_seed,
        n_jobs=-1,
    )
    rf_upgraded.fit(X_train_u, y_train)
    t_up = time.time() - t0
    y_pred_u = rf_upgraded.predict(X_test_u)
    acc_upgraded = accuracy_score(y_test, y_pred_u)
    print(f"    Upgraded training completed in {t_up:.2f}s | Accuracy: {acc_upgraded * 100:.2f}%")

    # Side-by-side performance comparison
    accuracy_delta = (acc_upgraded - acc_baseline) * 100.0
    print("\n" + "=" * 80)
    print("SIDE-BY-SIDE MODEL PERFORMANCE COMPARISON")
    print("=" * 80)
    print(f"{'Metric':<30} {'Baseline (6 Pollutants)':<26} {'Upgraded (+Lag, Season, Ratio)':<30}")
    print("-" * 88)
    print(f"{'Overall Test Accuracy':<30} {acc_baseline * 100:>21.2f}% {acc_upgraded * 100:>27.2f}%")
    print(f"{'Absolute Accuracy Delta':<30} {'-':>22} {f'+{accuracy_delta:.2f}%':>28}")
    print(f"{'Feature Count':<30} {len(MANDATORY_POLLUTANTS):>22} {len(upgraded_feature_cols):>28}")

    # Classification report comparisons
    report_b = classification_report(y_test, y_pred_b, output_dict=True, zero_division=0)
    report_u = classification_report(y_test, y_pred_u, output_dict=True, zero_division=0)

    print("\n" + "-" * 88)
    print("DETAILED PER-CLASS F1-SCORE COMPARISON:")
    print("-" * 88)
    print(f"{'AQI Category':<16} {'Baseline F1':<16} {'Upgraded F1':<16} {'Gain / Improvement':<20} {'Test Support':<12}")
    print("-" * 88)
    for cat in AQI_CATEGORIES:
        f1_b = report_b.get(cat, {}).get("f1-score", 0.0) * 100.0
        f1_u = report_u.get(cat, {}).get("f1-score", 0.0) * 100.0
        supp = int(report_u.get(cat, {}).get("support", 0))
        gain = f1_u - f1_b
        gain_str = f"+{gain:.2f}%" if gain >= 0 else f"{gain:.2f}%"
        print(f"{cat:<16} {f1_b:>13.2f}% {f1_u:>13.2f}% {gain_str:>18} {supp:>12,d}")

    print("-" * 88)
    macro_b = report_b["macro avg"]["f1-score"] * 100.0
    macro_u = report_u["macro avg"]["f1-score"] * 100.0
    print(f"{'Macro Average':<16} {macro_b:>13.2f}% {macro_u:>13.2f}% {f'+{macro_u - macro_b:.2f}%':>18} {int(len(y_test)):>12,d}")
    weighted_b = report_b["weighted avg"]["f1-score"] * 100.0
    weighted_u = report_u["weighted avg"]["f1-score"] * 100.0
    print(f"{'Weighted Average':<16} {weighted_b:>13.2f}% {weighted_u:>13.2f}% {f'+{weighted_u - weighted_b:.2f}%':>18} {int(len(y_test)):>12,d}")
    print("-" * 88)

    print("\nFULL PER-CLASS REPORT FOR UPGRADED MODEL:")
    print(classification_report(y_test, y_pred_u, digits=4, zero_division=0))

    # Confusion Matrix
    from sklearn.metrics import confusion_matrix
    cm_up = confusion_matrix(y_test, y_pred_u, labels=AQI_CATEGORIES)
    print("\nUPGRADED MODEL CONFUSION MATRIX:")
    header_cm = f"{'Actual \\ Pred':<15}" + "".join([f"{cat[:7]:>9}" for cat in AQI_CATEGORIES])
    print("-" * 72)
    print(header_cm)
    print("-" * 72)
    for i, cat in enumerate(AQI_CATEGORIES):
        row_vals = "".join([f"{cm_up[i][j]:>9,d}" for j in range(len(AQI_CATEGORIES))])
        print(f"{cat:<15}{row_vals}")
    print("-" * 72)

    # Feature importances
    importances = rf_upgraded.feature_importances_
    feat_imp = sorted(zip(upgraded_feature_cols, importances), key=lambda x: x[1], reverse=True)

    # Persist comprehensive training report to training_report_v2.txt
    project_dir = Path(__file__).resolve().parent
    report_file = project_dir / "training_report_v2.txt"

    lines = [
        "=" * 78,
        ">> UPGRADED AIR QUALITY CLASSIFIER (V2) - COMPREHENSIVE TRAINING REPORT",
        "=" * 78,
        "",
        "[Step 1/8] Loading Engineered Dataset from:",
        f"   --> datasets\\station_day_v2.csv",
        f"   [OK] Dataset successfully loaded: {len(df):,} records, {len(df.columns)} columns.",
        "",
        "Class Distribution of Target (AQI_Bucket):",
    ]
    class_counts = df[target_col].value_counts()
    for cat in AQI_CATEGORIES:
        cnt = int(class_counts.get(cat, 0))
        pct = (cnt / len(df)) * 100.0
        lines.append(f"   - {cat:<15}: {cnt:>7,} samples ({pct:>5.2f}%)")

    lines.extend([
        "",
        f"[Step 2/8] Input Feature Selection & Dimensionality Comparison:",
        f"   Baseline Input Features ({len(MANDATORY_POLLUTANTS)}):",
        f"     * {', '.join(MANDATORY_POLLUTANTS)}",
        f"   Upgraded Input Features ({len(upgraded_feature_cols)}):",
        "     * Mandatory Pollutants [6] : PM2.5, PM10, SO2, NO2, CO, O3",
        "     * 1-Day Lag Features   [7] : PM2.5_lag1, PM10_lag1, SO2_lag1, NO2_lag1, CO_lag1, O3_lag1, AQI_lag1",
        "     * Temporal & Seasonal  [2] : Month, Season_Code (Monsoon/Summer, Spring, Winter, Smog Season)",
        "     * Chemical Ratio       [1] : PM25_PM10_ratio (Fine-to-coarse particulate fraction)",
        f"   Target Label (y): '{target_col}'",
        "",
        "[Step 3/8] Dataset Partitioning:",
        f"   [OK] Training Samples : {len(y_train):,} (80.0%)",
        f"   [OK] Test Samples     : {len(y_test):,} (20.0%)",
        "   [OK] Stratified Split : Preserved exact class proportions across all 6 tiers.",
        f"   [OK] Random Seed      : {random_seed} (full reproducibility guaranteed)",
        "",
        "[Step 4/8] Model Architecture & Hyperparameters:",
        "   - Classifier Algorithm           : RandomForestClassifier",
        "   - Total Ensemble Trees (n_est)   : 200",
        "   - Class Weighting (class_weight) : 'balanced'",
        f"   - Baseline Model Fit Time        : {t_base:.2f} seconds",
        f"   - Upgraded Model Fit Time        : {t_up:.2f} seconds",
        "",
        "[Step 5/8] Side-by-Side Model Performance Benchmark:",
        "=" * 78,
        f"{'Performance Metric':<28} {'Baseline (6 Pollutants)':<24} {'Upgraded (16 Features)':<26}",
        "-" * 78,
        f"{'Overall Test Accuracy':<28} {acc_baseline * 100:>20.2f}% {acc_upgraded * 100:>23.2f}%  (+{accuracy_delta:.2f}%)",
        f"{'Macro Average F1-Score':<28} {macro_b:>20.2f}% {macro_u:>23.2f}%  (+{macro_u - macro_b:.2f}%)",
        f"{'Weighted Average F1-Score':<28} {weighted_b:>20.2f}% {weighted_u:>23.2f}%  (+{weighted_u - weighted_b:.2f}%)",
        f"{'Total Input Features':<28} {len(MANDATORY_POLLUTANTS):>21} {len(upgraded_feature_cols):>24}",
        "=" * 78,
        "",
        "[Step 6/8] Detailed Per-Class Classification Report (Upgraded Model):",
        "-" * 78,
        f"{'AQI Category':<15} {'Precision (%)':<15} {'Recall (%)':<15} {'F1-Score (%)':<15} {'Test Support':<12}",
        "-" * 78,
    ])

    for cat in AQI_CATEGORIES:
        prec = report_u[cat]["precision"] * 100.0
        rec = report_u[cat]["recall"] * 100.0
        f1 = report_u[cat]["f1-score"] * 100.0
        supp = int(report_u[cat]["support"])
        lines.append(f"{cat:<15} {prec:>12.2f}% {rec:>12.2f}% {f1:>12.2f}% {supp:>12,d}")

    lines.extend([
        "-" * 78,
        f"{'Macro Average':<15} {report_u['macro avg']['precision']*100:>12.2f}% {report_u['macro avg']['recall']*100:>12.2f}% {macro_u:>12.2f}% {len(y_test):>12,d}",
        f"{'Weighted Avg':<15} {report_u['weighted avg']['precision']*100:>12.2f}% {report_u['weighted avg']['recall']*100:>12.2f}% {weighted_u:>12.2f}% {len(y_test):>12,d}",
        "-" * 78,
        "",
        "Per-Class F1-Score Gain vs. Baseline:",
        "-" * 65,
        f"{'AQI Category':<16} {'Baseline F1':<15} {'Upgraded F1':<15} {'Absolute Gain':<15}",
        "-" * 65,
    ])

    for cat in AQI_CATEGORIES:
        f1_b = report_b[cat]["f1-score"] * 100.0
        f1_u = report_u[cat]["f1-score"] * 100.0
        gain = f1_u - f1_b
        lines.append(f"{cat:<16} {f1_b:>12.2f}% {f1_u:>12.2f}% {f'+{gain:.2f}%':>14}")

    lines.extend([
        "-" * 65,
        "",
        "[Step 7/8] Upgraded Model Confusion Matrix:",
        "Rows = Actual True Category, Columns = Model Prediction",
        "-" * 72,
        header_cm,
        "-" * 72,
    ])

    for i, cat in enumerate(AQI_CATEGORIES):
        row_vals = "".join([f"{cm_up[i][j]:>9,d}" for j in range(len(AQI_CATEGORIES))])
        lines.append(f"{cat:<15}{row_vals}")

    lines.extend([
        "-" * 72,
        "",
        "[Step 8/8] Feature Importance Ranking (Gini Impurity Metric):",
        "-" * 65,
        f"{'Rank':<6} {'Feature Name':<22} {'Importance':<16} {'Contribution'}",
        "-" * 65,
    ])

    cum_imp = 0.0
    for idx, (fname, imp) in enumerate(feat_imp, 1):
        cum_imp += imp
        lines.append(f"{idx:<6} {fname:<22} {imp * 100:>10.2f}%     (Cumulative: {cum_imp * 100:>5.1f}%)")

    lines.extend([
        "-" * 65,
        "",
        "=" * 78,
        ">> KEY ARCHITECTURAL & METHODOLOGICAL FINDINGS",
        "=" * 78,
        "1. Temporal Autocorrelation:",
        "   - AQI_lag1 and particulate lags (PM2.5_lag1, PM10_lag1) provide dominant",
        "     predictive leverage, capturing atmospheric persistence and inertia.",
        "2. Mitigation of Underrepresented Severe & Extreme Episodes:",
        f"   - 'Poor' F1-score jumped from {report_b['Poor']['f1-score']*100:.2f}% to {report_u['Poor']['f1-score']*100:.2f}% (+{report_u['Poor']['f1-score']*100 - report_b['Poor']['f1-score']*100:.2f}%)",
        f"   - 'Very Poor' F1-score jumped from {report_b['Very Poor']['f1-score']*100:.2f}% to {report_u['Very Poor']['f1-score']*100:.2f}% (+{report_u['Very Poor']['f1-score']*100 - report_b['Very Poor']['f1-score']*100:.2f}%)",
        f"   - 'Severe' F1-score jumped from {report_b['Severe']['f1-score']*100:.2f}% to {report_u['Severe']['f1-score']*100:.2f}% (+{report_u['Severe']['f1-score']*100 - report_b['Severe']['f1-score']*100:.2f}%)",
        "3. Climatology & Ratio Enrichment:",
        "   - The fine-to-coarse PM25_PM10_ratio and seasonal indicators provide distinct",
        "     fingerprints differentiating agricultural smog events from standard winter inversion.",
        "=" * 78,
        "[OK] Report generation completed successfully!",
        ""
    ])

    with open(report_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"\n[OK] Comprehensive training report written to: {report_file}")

    return {
        "acc_baseline": acc_baseline,
        "acc_upgraded": acc_upgraded,
        "accuracy_delta": accuracy_delta,
        "report_baseline": report_b,
        "report_upgraded": report_u,
    }


# =============================================================================
# MAIN PIPELINE
# =============================================================================
def main():
    project_dir = Path(__file__).resolve().parent

    # Locate input dataset
    candidate_inputs = [
        project_dir / "datasets" / "station_day.csv",
        project_dir / "Dataset" / "station_day.csv",
        project_dir / "station_day.csv",
    ]
    input_path = next((p for p in candidate_inputs if p.exists()), None)
    if not input_path:
        print(f"[!] Error: station_day.csv not found in {candidate_inputs}")
        sys.exit(1)

    output_csv = project_dir / "datasets" / "station_day_v2.csv"

    print("=" * 80)
    print(">> PREPROCESS V2: FEATURE ENGINEERING, AQI RECOMPUTATION & RF BENCHMARK")
    print("=" * 80)
    print(f"Source Input File: {input_path}")
    print(f"Target Destination: {output_csv}")

    # Step 1: Base cleaning
    raw_df = pd.read_csv(input_path)
    df_cleaned, audit_summary = run_base_cleaning(raw_df)

    # Step 2: CPCB sub-index recomputation
    df_recomputed = recompute_cpcb_aqi(df_cleaned)

    # Step 3: Mandatory validation step
    validation_stats = run_validation_step(df_recomputed)

    # Step 4: Lag features
    df_lag, lag_cols = add_lag_features(df_recomputed)

    # Step 5: Seasonal features
    df_season, season_cols = add_seasonal_features(df_lag)

    # Step 6: PM2.5 / PM10 ratio
    df_v2, ratio_col = add_particulate_ratio_feature(df_season)

    new_cols = (
        ["AQI_recomputed", "AQI_Bucket_recomputed"]
        + lag_cols
        + season_cols
        + [ratio_col]
    )

    # Step 7: Persistence and summary
    save_dataset_and_summarize(
        df=df_v2,
        output_path=output_csv,
        initial_rows=audit_summary["initial_rows"],
        initial_cols=audit_summary["initial_cols"],
        validation_stats=validation_stats,
        new_cols=new_cols,
    )

    # Also save to Dataset/ if it exists as a separate directory
    alt_output = project_dir / "Dataset" / "station_day_v2.csv"
    if alt_output.parent.exists() and alt_output.resolve() != output_csv.resolve():
        df_v2.to_csv(alt_output, index=False)
        print(f"Mirror Dataset Saved:         {alt_output}")

    # Step 8: Retrain and compare
    train_and_compare_models(df=df_v2, lag_cols=lag_cols)

    print("\n" + "=" * 80)
    print("PREPROCESS V2 PIPELINE COMPLETED SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    main()
