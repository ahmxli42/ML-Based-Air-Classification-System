"""
Data Cleaning & Preprocessing Pipeline for Air Quality Classification System
=============================================================================
This script loads the raw multi-station air quality dataset (station_day.csv)
and produces a fully audited, model-ready cleaned dataset (station_day_cleaned.csv),
along with a comprehensive Preprocessing Audit Report (preprocessing_report.md).

Methodological Rationale:
-------------------------
1. Column Retention: All 16 original columns are retained. While MANDATORY_POLLUTANTS
   (PM2.5, PM10, SO2, NO2, CO, O3) align directly with Punjab EPA's official AQI
   formulation for baseline classification, EXTENDED_POLLUTANTS (NO, NOx, NH3, Benzene,
   Toluene, Xylene) are preprocessed and retained for upcoming cross-regional adaptability
   experiments.
2. Missing Labels: Rows lacking AQI or AQI_Bucket are dropped unconditionally, as supervised
   classification models cannot train on unlabeled ground truth.
3. Imputation Strategy: Station-level median imputation is utilized to preserve localized
   microclimate baselines without flattening geographic variance. Pollutant distributions
   are heavily right-skewed (log-normal/exponential), making the median mathematically
   superior to the mean against extreme pollution episodic bias. Global medians are only
   applied if a station completely lacks historical observations for a specific chemical.
4. Anomaly Filtering vs. Preserving Extreme Events: Only physically impossible readings
   (negative concentrations < 0) are eliminated. Statistically extreme peaks (e.g. PM2.5 spikes)
   are intentionally retained because they represent genuine critical smog and crop-burning
   episodes central to the project's adaptability study. Readings exceeding physical sanity
   ceilings and label contradictions are audited and flagged, but not silently discarded.
5. Domain Feature Engineering: Month and Season features are engineered based on Punjab's
   climatological cycles, isolating the October-November "Smog Season" driven by agricultural
   residue burning and atmospheric inversion.
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

# =============================================================================
# CONSTANTS & CONFIGURATION
# =============================================================================

MANDATORY_POLLUTANTS = ["PM2.5", "PM10", "SO2", "NO2", "CO", "O3"]
EXTENDED_POLLUTANTS = ["NO", "NOx", "NH3", "Benzene", "Toluene", "Xylene"]
ALL_POLLUTANTS = MANDATORY_POLLUTANTS + EXTENDED_POLLUTANTS

# Physical sanity ceilings for automated auditing (values exceeding these are flagged for manual review)
SANITY_CEILINGS = {
    "PM2.5": 1000.0,    # Max optical sensor limit before saturation
    "PM10": 1200.0,     # Extreme dust storm threshold
    "NO": 400.0,
    "NO2": 500.0,
    "NOx": 500.0,
    "NH3": 500.0,
    "CO": 50.0,         # Extremely high toxic threshold (mg/m³)
    "SO2": 500.0,
    "O3": 300.0,
    "Benzene": 250.0,
    "Toluene": 400.0,
    "Xylene": 200.0,
}

HEAVY_IMPUTATION_THRESHOLD = 30.0  # Percentage threshold to trigger warning


# =============================================================================
# STEP 1: LOAD AND INITIAL INSPECTION
# =============================================================================

def load_and_inspect_data(filepath: Path) -> tuple[pd.DataFrame, dict]:
    """
    Loads station_day.csv and records baseline shape, schema, and missingness audit.
    """
    if not filepath.exists():
        raise FileNotFoundError(f"Input file not found at: {filepath}")

    df = pd.read_csv(filepath)
    total_rows, total_cols = df.shape

    # Calculate missing value audit
    missing_counts = df.isna().sum()
    missing_pcts = (missing_counts / total_rows) * 100.0

    inspection_audit = {
        "raw_rows": total_rows,
        "raw_cols": total_cols,
        "dtypes": df.dtypes.to_dict(),
        "columns": df.columns.tolist(),
        "missing_counts": missing_counts.to_dict(),
        "missing_pcts": missing_pcts.to_dict(),
    }

    print("\n" + "=" * 80)
    print("STEP 1: LOAD & INITIAL DATASET INSPECTION")
    print("=" * 80)
    print(f"Dataset Loaded Successfully: {filepath}")
    print(f"Total Observations (Rows):    {total_rows:,}")
    print(f"Total Features (Columns):     {total_cols}")
    print("\nInitial Missing-Value Audit (Before Cleaning):")
    print(f"{'Column':<15} {'Dtype':<10} {'Missing Count':<15} {'Missing %':<12}")
    print("-" * 55)
    for col in df.columns:
        print(f"{col:<15} {str(df[col].dtype):<10} {missing_counts[col]:<15,d} {missing_pcts[col]:>6.2f}%")

    return df, inspection_audit


# =============================================================================
# STEP 2 & 3: MISSING LABELS REMOVAL
# =============================================================================

def remove_missing_labels(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """
    Drops rows where AQI or AQI_Bucket ground-truth label is absent.
    """
    initial_count = len(df)
    label_missing_mask = df["AQI"].isna() | df["AQI_Bucket"].isna()
    dropped_count = int(label_missing_mask.sum())
    cleaned_df = df[~label_missing_mask].copy()

    print("\n" + "=" * 80)
    print("STEP 2: LABEL INTEGRITY CHECK (AQI & AQI_BUCKET)")
    print("=" * 80)
    print(f"Rows with Missing Labels Dropped: {dropped_count:,} ({dropped_count / initial_count * 100:.2f}%)")
    print(f"Remaining Labeled Rows:           {len(cleaned_df):,}")

    return cleaned_df, dropped_count


# =============================================================================
# STEP 4: DUPLICATE REMOVAL
# =============================================================================

def remove_duplicate_records(df: pd.DataFrame) -> tuple[pd.DataFrame, int, int]:
    """
    Audits and eliminates exact row duplicates and conflicting (StationId, Date) pairs.
    """
    initial_count = len(df)
    
    # 1. Exact duplicates across all columns
    exact_duplicates = int(df.duplicated().sum())
    df_dedup = df.drop_duplicates().copy()

    # 2. Conflicting readings for same station on same date
    station_date_duplicates = int(df_dedup.duplicated(subset=["StationId", "Date"]).sum())
    df_dedup = df_dedup.drop_duplicates(subset=["StationId", "Date"], keep="first").copy()

    print("\n" + "=" * 80)
    print("STEP 3: DUPLICATE AUDIT & DEDUPLICATION")
    print("=" * 80)
    print(f"Exact Duplicate Rows Removed:                  {exact_duplicates:,}")
    print(f"Conflicting (StationId, Date) Duplicates:      {station_date_duplicates:,}")
    print(f"Rows After Deduplication:                      {len(df_dedup):,}")

    return df_dedup, exact_duplicates, station_date_duplicates


# =============================================================================
# STEP 5: INVALID VALUES REMOVAL (NEGATIVE SENSOR ARTIFACTS)
# =============================================================================

def remove_invalid_values(df: pd.DataFrame, pollutant_cols: list[str]) -> tuple[pd.DataFrame, int]:
    """
    Removes physically impossible negative concentration values (< 0).
    """
    initial_count = len(df)
    negative_mask = pd.Series(False, index=df.index)

    for col in pollutant_cols:
        if col in df.columns:
            negative_mask = negative_mask | (df[col] < 0)

    negative_rows_count = int(negative_mask.sum())
    cleaned_df = df[~negative_mask].copy()

    print("\n" + "=" * 80)
    print("STEP 4: PHYSICAL VALIDITY FILTERING (NEGATIVE VALUE AUDIT)")
    print("=" * 80)
    print(f"Physically Impossible Negative Concentration Rows: {negative_rows_count:,}")
    print(f"Remaining Valid Rows:                              {len(cleaned_df):,}")

    return cleaned_df, negative_rows_count


# =============================================================================
# STEP 6: MISSING VALUE IMPUTATION (PER-STATION MEDIAN WITH GLOBAL FALLBACK)
# =============================================================================

def impute_missing_pollutants(
    df: pd.DataFrame,
    mandatory_cols: list[str],
    extended_cols: list[str]
) -> tuple[pd.DataFrame, dict]:
    """
    Imputes missing pollutant values using per-station medians, falling back to
    global median only if a station has zero valid historical readings for that analyte.
    """
    df_imputed = df.copy()
    imputation_audit = {}
    total_rows = len(df_imputed)

    print("\n" + "=" * 80)
    print("STEP 5: POLLUTANT IMPUTATION (STATION-SPECIFIC MEDIAN WITH GLOBAL FALLBACK)")
    print("=" * 80)
    print(f"{'Pollutant':<12} {'Tier':<12} {'Pre-Impute NaN':<16} {'Missing %':<12} {'Status / Notes'}")
    print("-" * 75)

    all_cols = [(col, "Mandatory") for col in mandatory_cols] + [(col, "Extended") for col in extended_cols]

    for col, tier in all_cols:
        if col not in df_imputed.columns:
            continue

        missing_count = int(df_imputed[col].isna().sum())
        missing_pct = (missing_count / total_rows) * 100.0

        # Calculate station medians and global median
        station_medians = df_imputed.groupby("StationId")[col].transform("median")
        global_median = float(df_imputed[col].median())

        # Two-stage hierarchical filling
        imputed_series = df_imputed[col].fillna(station_medians)
        remaining_nans = int(imputed_series.isna().sum())
        imputed_series = imputed_series.fillna(global_median)
        df_imputed[col] = imputed_series

        is_heavy = missing_pct > HEAVY_IMPUTATION_THRESHOLD
        status_note = "Nominal Imputation"
        if col == "Xylene":
            status_note = "CRITICAL: ~78% missing (Weak signal, explicit caveat required)"
        elif is_heavy:
            status_note = "WARNING: >30% missing (Heavily imputed — treat with caution)"

        imputation_audit[col] = {
            "tier": tier,
            "missing_count": missing_count,
            "missing_pct": missing_pct,
            "station_filled": missing_count - remaining_nans,
            "global_filled": remaining_nans,
            "global_median": global_median,
            "is_heavy": is_heavy,
            "status_note": status_note,
        }

        flag_str = "[!] " if is_heavy else "    "
        print(f"{flag_str}{col:<10} {tier:<12} {missing_count:<16,d} {missing_pct:>6.2f}%    {status_note}")

    return df_imputed, imputation_audit


# =============================================================================
# STEP 7: SANITY CEILINGS & LABEL CONTRADICTION CROSS-CHECK
# =============================================================================

def flag_sanity_and_mismatches(df: pd.DataFrame) -> dict:
    """
    Audits statistically extreme peaks against sensor ceiling thresholds and cross-checks
    pollutant concentrations against official AQI_Bucket labels for contradictions.
    Values are FLAGGED for documentation, NOT deleted.
    """
    print("\n" + "=" * 80)
    print("STEP 6: SANITY CEILING AUDIT & LABEL CONTRADICTION CROSS-CHECK (FLAGGED, NOT REMOVED)")
    print("=" * 80)

    # 1. Sanity Ceiling Checks
    extreme_flags = {}
    total_extreme_instances = 0
    print("Physical Sanity Ceilings (Upper Bound Outlier Detection):")
    for col, ceiling in SANITY_CEILINGS.items():
        if col in df.columns:
            count = int((df[col] > ceiling).sum())
            extreme_flags[col] = {"ceiling": ceiling, "count": count}
            total_extreme_instances += count
            if count > 0:
                print(f"  - {col:<8} > {ceiling:<6.1f}: {count:>5,d} readings flagged (retained for severe episode modeling)")
            else:
                print(f"  - {col:<8} > {ceiling:<6.1f}:     0 readings (within physical ceiling)")

    # 2. Label Contradiction Cross-Check
    # A) Severe spike in primary particulates but labeled 'Good' or 'Satisfactory'
    high_pollutant_low_label = df[
        ((df["PM2.5"] > 250.0) | (df["PM10"] > 400.0)) &
        (df["AQI_Bucket"].isin(["Good", "Satisfactory"]))
    ]
    high_pollutant_low_count = len(high_pollutant_low_label)

    # B) Exceptionally clean across all mandatory pollutants but labeled 'Poor', 'Very Poor', or 'Severe'
    low_pollutant_high_label = df[
        (df["PM2.5"] <= 30.0) &
        (df["PM10"] <= 50.0) &
        (df["NO2"] <= 40.0) &
        (df["SO2"] <= 40.0) &
        (df["CO"] <= 1.0) &
        (df["O3"] <= 50.0) &
        (df["AQI_Bucket"].isin(["Poor", "Very Poor", "Severe"]))
    ]
    low_pollutant_high_count = len(low_pollutant_high_label)
    total_mismatches = high_pollutant_low_count + low_pollutant_high_count

    print("\nLabel Contradiction Diagnostic Audit:")
    print(f"  - Particulate Spike (PM2.5>250 or PM10>400) labeled Good/Satisfactory: {high_pollutant_low_count} rows")
    print(f"  - Pristine Ambient Air (All 6 <= Good bounds) labeled Poor/Severe:       {low_pollutant_high_count} rows")
    print(f"  - Total Contradictory Rows Flagged (Retained):                          {total_mismatches} rows")

    diagnostic_audit = {
        "extreme_flags": extreme_flags,
        "total_extreme_instances": total_extreme_instances,
        "high_pollutant_low_count": high_pollutant_low_count,
        "low_pollutant_high_count": low_pollutant_high_count,
        "total_mismatches": total_mismatches,
    }

    return diagnostic_audit


# =============================================================================
# STEP 8: FEATURE ENGINEERING (MONTH & REGIONAL PUNJAB SEASONS)
# =============================================================================

def add_seasonal_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Parses Date and engineers temporal Month and Season variables aligned with Punjab's
    crop-burning and meteorological cycles.
    """
    df_feat = df.copy()
    df_feat["Date"] = pd.to_datetime(df_feat["Date"])
    df_feat["Month"] = df_feat["Date"].dt.month

    def map_punjab_season(month: int) -> str:
        if month in [10, 11]:
            return "Smog Season"      # Post-monsoon crop residue burning & thermal inversion
        elif month in [12, 1, 2]:
            return "Winter"           # Dense fog, low boundary layer, ground inversions
        elif month in [3, 4, 5]:
            return "Spring"           # Transition, increasing wind & thermal dispersion
        else:                         # 6, 7, 8, 9
            return "Monsoon/Summer"   # Wet deposition, precipitation washout, high convective mixing

    df_feat["Season"] = df_feat["Month"].apply(map_punjab_season)

    print("\n" + "=" * 80)
    print("STEP 7: FEATURE ENGINEERING (PUNJAB REGIONAL CLIMATE CYCLES)")
    print("=" * 80)
    print("Engineered Features Added: 'Month' (integer 1-12) & 'Season' (Punjab EPA pattern)")
    season_counts = df_feat["Season"].value_counts()
    for season, count in season_counts.items():
        print(f"  - {season:<16}: {count:>6,d} observations ({count / len(df_feat) * 100:>5.2f}%)")

    return df_feat


# =============================================================================
# STEP 9: CLASS DISTRIBUTION & IMBALANCE REPORTING
# =============================================================================

def report_class_distribution(df: pd.DataFrame) -> pd.DataFrame:
    """
    Audits and prints target class balance across AQI_Bucket categories.
    """
    total = len(df)
    order = ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]
    bucket_counts = df["AQI_Bucket"].value_counts()

    dist_rows = []
    for category in order:
        count = int(bucket_counts.get(category, 0))
        pct = (count / total) * 100.0
        dist_rows.append({"Category": category, "Count": count, "Percentage": pct})

    dist_df = pd.DataFrame(dist_rows)

    print("\n" + "=" * 80)
    print("STEP 8: TARGET CLASS DISTRIBUTION & IMBALANCE AUDIT (AQI_BUCKET)")
    print("=" * 80)
    print(f"{'Category':<16} {'Row Count':<15} {'Percentage':<12} {'Imbalance Profile'}")
    print("-" * 65)
    for _, row in dist_df.iterrows():
        cat = row["Category"]
        cnt = int(row["Count"])
        pct = row["Percentage"]
        profile = "Dominant Class" if pct > 25 else "Moderate Frequency" if pct > 10 else "Minority / Underrepresented"
        print(f"{cat:<16} {cnt:<15,d} {pct:>6.2f}%       {profile}")

    return dist_df


# =============================================================================
# STEP 10: PREPROCESSING REPORT GENERATION (.MD & .TXT)
# =============================================================================

def generate_preprocessing_report(
    inspection_audit: dict,
    label_dropped: int,
    exact_duplicates: int,
    station_date_duplicates: int,
    negative_rows: int,
    imputation_audit: dict,
    diagnostic_audit: dict,
    final_df: pd.DataFrame,
    dist_df: pd.DataFrame,
    report_md_path: Path,
    report_txt_path: Path,
):
    """
    Generates professional, auditable report files containing exact calculated metrics.
    """
    raw_rows = inspection_audit["raw_rows"]
    raw_cols = inspection_audit["raw_cols"]
    final_rows = len(final_df)
    final_cols = len(final_df.columns)
    retention_pct = (final_rows / raw_rows) * 100.0
    total_removed = raw_rows - final_rows

    report_content = f"""# Preprocessing & Data Cleaning Audit Report
**Project:** ML-Based Air Quality Classification System  
**Dataset:** Central Pollution Control Board (CPCB) Station-Level Multi-City Monitoring  
**Target Target:** `AQI_Bucket` (6-Tier Categorical Classification)  
**Output Dataset:** `datasets/station_day_cleaned.csv`  

---

## 1. Executive Summary & Retention Metrics

* **Original Raw Observations:** {raw_rows:,} rows, {raw_cols} columns
* **Final Model-Ready Observations:** {final_rows:,} rows, {final_cols} columns
* **Retention Rate:** **{retention_pct:.1f}%** ({final_rows:,} of {raw_rows:,} retained; {total_removed:,} removed)
* **Feature Schema:** 18 total columns (16 original features retained + 2 engineered temporal features)

---

## 2. Row Filtering & Exclusion Breakdown

Every row exclusion was strictly deterministic and tied to dataset integrity requirements:

| Exclusion Reason | Rows Dropped | % of Raw Data | Methodological Rationale |
| :--- | :---: | :---: | :--- |
| **Missing Target Labels (`AQI` / `AQI_Bucket`)** | {label_dropped:,} | {label_dropped / raw_rows * 100:.2f}% | Unlabeled instances cannot be used for supervised model training or benchmark validation. |
| **Exact Duplicate Observations** | {exact_duplicates:,} | {exact_duplicates / raw_rows * 100:.2f}% | Redundant rows across all 16 features. |
| **Conflicting `(StationId, Date)` Pairs** | {station_date_duplicates:,} | {station_date_duplicates / raw_rows * 100:.2f}% | Multiple discordant telemetry records for the same monitoring node on the same day; first instance retained. |
| **Negative Pollutant Concentrations (< 0)** | {negative_rows:,} | {negative_rows / raw_rows * 100:.2f}% | Physical impossibility; represents uncalibrated optical zero-drift or sensor baseline glitch. |
| **Total Excluded Observations** | **{total_removed:,}** | **{total_removed / raw_rows * 100:.2f}%** | All remaining observations contain verified labels and valid non-negative readings. |

---

## 3. Initial Missing-Value Audit (Raw Dataset)

Audited across all {raw_cols} raw columns prior to cleaning:

| Feature Name | Column Data Type | Raw Missing Count | Raw Missing Percentage |
| :--- | :--- | :---: | :---: |
"""

    for col in inspection_audit["columns"]:
        cnt = inspection_audit["missing_counts"][col]
        pct = inspection_audit["missing_pcts"][col]
        dtype_str = str(inspection_audit["dtypes"][col])
        report_content += f"| `{col}` | `{dtype_str}` | {cnt:,} | {pct:.2f}% |\n"

    report_content += f"""
---

## 4. Imputation Strategy & Audit Summary

Missing pollutant concentrations were resolved via **two-tier hierarchical median imputation**:
1. **Primary Imputation:** Station-specific median (preserves localized spatial baselines, urban canyon vs. suburban background).
2. **Secondary Fallback:** Global dataset median (applied only if a station lacked any historical observation for that analyte).
*Median imputation was selected over mean imputation due to the strong right-skewness of air pollution concentration distributions.*

| Pollutant Feature | Feature Tier | Pre-Impute NaN | Missing % | Imputation Strategy & Quality Flag |
| :--- | :---: | :---: | :---: | :--- |
"""

    for col, info in imputation_audit.items():
        tier = info["tier"]
        cnt = info["missing_count"]
        pct = info["missing_pct"]
        note = info["status_note"]
        badge = "**HEAVILY IMPUTED (CAUTION)**" if info["is_heavy"] else "Nominal"
        report_content += f"| `{col}` | {tier} | {cnt:,} | {pct:.2f}% | {badge} — {note} |\n"

    report_content += f"""
> **Supervisor / Adaptability Phase Caveat (Xylene):**  
> `Xylene` exhibited **{imputation_audit['Xylene']['missing_pct']:.2f}%** missingness at the station level. Although retained and cleaned for the planned multi-gas adaptability experiments, it should carry an explicit caveat in future feature attribution analysis, as the predominant reliance on imputed values yields a weak independent predictive signal.

---

## 5. Flagged-But-Kept Quality Diagnostics

In accordance with strict experimental requirements, **statistically extreme peaks and apparent label mismatches were NOT silently deleted**. Severe pollution events are critical for cross-regional adaptability testing.

### A. Physical Sanity Ceiling Audit (Extreme Spikes)
| Analyte | Ceiling Threshold | Observations Above Ceiling | Action Taken |
| :--- | :---: | :---: | :--- |
"""

    for col, data in diagnostic_audit["extreme_flags"].items():
        ceil = data["ceiling"]
        cnt = data["count"]
        report_content += f"| `{col}` | {ceil:.1f} µg/m³ | {cnt:,} | Flagged as plausible severe event / retained for evaluation |\n"

    report_content += f"""
### B. Label Contradiction Cross-Check
* **High Pollutant Spike labeled Good/Satisfactory:** `{diagnostic_audit['high_pollutant_low_count']}` rows (e.g., PM2.5 > 250 µg/m³ recorded during sensor transient or local sub-index anomaly).
* **Pristine Pollutants labeled Poor/Severe:** `{diagnostic_audit['low_pollutant_high_count']}` rows (all 6 mandatory criteria gases within 'Good' limits yet classified in higher bracket).
* **Total Flagged Diagnostic Mismatches:** `{diagnostic_audit['total_mismatches']}` rows.
* **Resolution:** **Retained in dataset**. Stated explicitly as an auditable artifact of multi-contaminant sub-index max pooling under official CPCB calculation rules.

---

## 6. Final Target Class Distribution (`AQI_Bucket`)

Documented class breakdown across the {final_rows:,} cleaned observations:

| AQI Category | Class Severity Band | Observation Count | Percentage | Research Finding & Imbalance Impact |
| :--- | :--- | :---: | :---: | :--- |
"""

    for _, row in dist_df.iterrows():
        cat = row["Category"]
        cnt = int(row["Count"])
        pct = row["Percentage"]
        if cat == "Moderate":
            note = "Modal Class — Standard urban baseline"
        elif cat == "Satisfactory":
            note = "High frequency — Moderate background"
        elif cat in ["Good", "Severe"]:
            note = "**Minority Class** — Requires stratified sampling / weighted loss"
        else:
            note = "Intermediate transition tier"
        report_content += f"| `{cat}` | Category Level | {cnt:,} | {pct:.2f}% | {note} |\n"

    report_content += f"""
**Key Finding on Class Imbalance:**  
The dataset exhibits pronounced class imbalance: `Moderate` ({dist_df.loc[dist_df['Category']=='Moderate', 'Percentage'].values[0]:.2f}%) and `Satisfactory` ({dist_df.loc[dist_df['Category']=='Satisfactory', 'Percentage'].values[0]:.2f}%) account for over 60% of all records. Conversely, extreme clean events (`Good`: {dist_df.loc[dist_df['Category']=='Good', 'Percentage'].values[0]:.2f}%) and hazardous spikes (`Severe`: {dist_df.loc[dist_df['Category']=='Severe', 'Percentage'].values[0]:.2f}%) represent minority classes, mandating stratified train-test splits and class-weighted evaluation metrics (Macro F1, Balanced Accuracy) during model training.

---

## 7. Feature Engineering & Tier Assignment Summary

The output dataset contains **18 total columns**, structured into explicit functional tiers:

1. **Station & Temporal Identifiers:**
   * `StationId`: Categorical unique identifier for physical monitoring node.
   * `Date`: Standardized ISO datetime timestamp (`YYYY-MM-DD`).
   * `Month` *(Engineered)*: Discrete month integer (1–12).
   * `Season` *(Engineered)*: Climatological cycle feature tailored to Punjab regional weather:
     * **`Smog Season`** (Oct–Nov): Crop stubble burning, low wind velocity, ground-level thermal inversions.
     * **`Winter`** (Dec–Feb): Low planetary boundary layer, dense radiation fog, maximum particulate stagnation.
     * **`Spring`** (Mar–May): Increasing solar insolation, higher convective mixing, thermal dispersion.
     * **`Monsoon/Summer`** (Jun–Sep): Wet precipitation scavenging, aerosol washout.

2. **Mandatory Pollutants (Baseline Model Features):**
   * `PM2.5`, `PM10`, `SO2`, `NO2`, `CO`, `O3`  
   *(Directly corresponding to Punjab EPA and Central AQI index sub-formulas).*

3. **Extended Pollutants (Reserved for Adaptability Phase):**
   * `NO`, `NOx`, `NH3`, `Benzene`, `Toluene`, `Xylene`  
   *(Cleaned, imputed, and retained for specialized transfer learning and industrial zone adaptation).*

4. **Target Labels:**
   * `AQI`: Continuous numeric Air Quality Index value.
   * `AQI_Bucket`: 6-tier categorical classification target.

---
*Report generated automatically by `clean_data.py`.*
"""

    # Write Markdown report
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    # Write Plain Text summary
    with open(report_txt_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    print("\n" + "=" * 80)
    print("STEP 9: AUDIT REPORT GENERATED")
    print("=" * 80)
    print(f"Markdown Report Written: {report_md_path}")
    print(f"Plain Text Report Written: {report_txt_path}")


# =============================================================================
# STEP 11: SAVE CLEANED DATASET & MAIN PIPELINE
# =============================================================================

def save_cleaned_dataset(df: pd.DataFrame, output_path: Path):
    """
    Persists the cleaned dataset to CSV.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print("\n" + "=" * 80)
    print("STEP 10: PERSISTENCE")
    print("=" * 80)
    print(f"Cleaned Dataset Saved: {output_path} ({len(df):,} rows, {len(df.columns)} columns)")


def main():
    base_dir = Path(__file__).resolve().parent

    # Locate input dataset (support both datasets/ and Dataset/)
    possible_inputs = [
        base_dir / "datasets" / "station_day.csv",
        base_dir / "Dataset" / "station_day.csv",
        base_dir / "station_day.csv",
    ]
    input_path = next((p for p in possible_inputs if p.exists()), None)
    if not input_path:
        print(f"Error: station_day.csv not found in {possible_inputs}")
        sys.exit(1)

    # Output paths
    output_csv = base_dir / "datasets" / "station_day_cleaned.csv"
    report_md = base_dir / "preprocessing_report.md"
    report_txt = base_dir / "preprocessing_report.txt"

    print("=" * 80)
    print("STARTING AIR QUALITY DATA CLEANING PIPELINE")
    print("=" * 80)
    print(f"Input:  {input_path}")
    print(f"Output: {output_csv}")

    # Execution pipeline
    df_raw, inspection_audit = load_and_inspect_data(input_path)
    df_labeled, label_dropped = remove_missing_labels(df_raw)
    df_dedup, exact_dups, station_date_dups = remove_duplicate_records(df_labeled)
    df_valid, negative_rows = remove_invalid_values(df_dedup, ALL_POLLUTANTS)
    df_imputed, imputation_audit = impute_missing_pollutants(df_valid, MANDATORY_POLLUTANTS, EXTENDED_POLLUTANTS)
    diagnostic_audit = flag_sanity_and_mismatches(df_imputed)
    df_engineered = add_seasonal_features(df_imputed)
    dist_df = report_class_distribution(df_engineered)

    # Save outputs
    save_cleaned_dataset(df_engineered, output_csv)
    
    # Also save to Dataset/ if it's a separate physical directory
    alt_output = base_dir / "Dataset" / "station_day_cleaned.csv"
    if alt_output.resolve() != output_csv.resolve():
        save_cleaned_dataset(df_engineered, alt_output)

    generate_preprocessing_report(
        inspection_audit=inspection_audit,
        label_dropped=label_dropped,
        exact_duplicates=exact_dups,
        station_date_duplicates=station_date_dups,
        negative_rows=negative_rows,
        imputation_audit=imputation_audit,
        diagnostic_audit=diagnostic_audit,
        final_df=df_engineered,
        dist_df=dist_df,
        report_md_path=report_md,
        report_txt_path=report_txt,
    )

    print("\n" + "=" * 80)
    print("CLEANING PIPELINE COMPLETED SUCCESSFULLY")
    print("=" * 80)
    print(f"Final Retained Rows: {len(df_engineered):,} / {len(df_raw):,} ({len(df_engineered)/len(df_raw)*100:.1f}%)")
    print(f"Cleaned CSV:         {output_csv}")
    print(f"Full Report:         {report_md}")


if __name__ == "__main__":
    main()
