"""
Air Quality Classification System - Baseline Model Training Script
Author: Machine Learning Project Team
Description:
    Trains and evaluates a baseline Random Forest Classifier to predict AQI categories
    (AQI_Bucket) using Punjab's 6 mandatory pollutant parameters:
    PM2.5, PM10, SO2, NO2, CO, and O3.

    Follows specifications defined in training_script.md.
"""

from pathlib import Path
import sys
import time
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# Ensure Windows terminal handles UTF-8 safely
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


class DualLogger:
    """Mirrors stdout to both the console and a report file."""
    def __init__(self, filepath):
        self.terminal = sys.stdout
        self.log_file = open(filepath, "w", encoding="utf-8")

    def write(self, message):
        self.terminal.write(message)
        self.log_file.write(message)

    def flush(self):
        self.terminal.flush()
        self.log_file.flush()

    def close(self):
        self.log_file.close()


def main():
    # Resolve paths relative to this script
    project_dir = Path(__file__).resolve().parent
    report_file = project_dir / "training_report.txt"
    logger = DualLogger(report_file)
    sys.stdout = logger

    print("=" * 75)
    print(">> BASELINE AIR QUALITY CLASSIFIER - TRAINING PIPELINE")
    print("=" * 75)

    # -------------------------------------------------------------------------
    # STEP 1: LOAD CLEANED DATA
    # -------------------------------------------------------------------------
    # Resolve paths relative to this script
    project_dir = Path(__file__).resolve().parent
    data_path = project_dir / "datasets" / "station_day_cleaned.csv"

    if not data_path.exists():
        print(f"[!] Error: Cleaned dataset not found at {data_path}")
        print("Please verify that preprocessing has been executed.")
        sys.exit(1)

    print(f"\n[Step 1/7] Loading cleaned dataset from:")
    print(f"   --> {data_path.relative_to(project_dir)}")
    df = pd.read_csv(data_path)
    total_rows = len(df)
    print(f"   [OK] Dataset successfully loaded: {total_rows:,} records.")

    # Validate target column presence
    target_col = "AQI_Bucket"
    if target_col not in df.columns:
        print(f"[!] Error: Target column '{target_col}' missing from dataset.")
        sys.exit(1)

    print("\nInitial Class Distribution of AQI Categories (Target: AQI_Bucket):")
    class_counts = df[target_col].value_counts()
    class_pcts = df[target_col].value_counts(normalize=True) * 100
    distribution_df = pd.DataFrame({
        "Sample Count": class_counts,
        "Percentage (%)": class_pcts.round(2)
    })
    for category, row in distribution_df.iterrows():
        print(f"   - {category:<15}: {int(row['Sample Count']):>7,} samples ({row['Percentage (%)']:>5.2f}%)")

    # -------------------------------------------------------------------------
    # STEP 2: FEATURE SELECTION
    # -------------------------------------------------------------------------
    # Mandatory 6 pollutants corresponding to Punjab's official AQI formula
    mandatory_features = ["PM2.5", "PM10", "SO2", "NO2", "CO", "O3"]

    # Extended pollutants reserved for adaptability experiments
    extended_pollutants = ["NO", "NOx", "NH3", "Benzene", "Toluene", "Xylene"]

    print("\n[Step 2/7] Feature Selection:")
    print(f"   [OK] Selected Input Features (X) [{len(mandatory_features)}]: {', '.join(mandatory_features)}")
    print(f"        (Matches Punjab's official 6-pollutant AQI formula)")
    print(f"   [i]  Deliberately Excluded Features [{len(extended_pollutants)}]: {', '.join(extended_pollutants)}")
    print(f"        (Preserved in dataset but reserved for separate adaptability experiments)")
    print(f"   --> Target Label (y): '{target_col}'")

    # Check for any missing values in the mandatory features or target
    missing_in_features = df[mandatory_features].isnull().sum()
    if missing_in_features.any():
        print("[!] Warning: Missing values detected in mandatory features:")
        print(missing_in_features[missing_in_features > 0])
        # Drop rows with NaN if any exist
        clean_mask = df[mandatory_features + [target_col]].notnull().all(axis=1)
        df = df[clean_mask]
        print(f"   Filtered to {len(df):,} complete records.")

    X = df[mandatory_features]
    y = df[target_col]

    # -------------------------------------------------------------------------
    # STEP 3: TRAIN / TEST SPLIT (80% / 20%)
    # -------------------------------------------------------------------------
    print("\n[Step 3/7] Splitting Dataset into Train (80%) and Test (20%):")
    # Using stratify=y to ensure proportional representation of rare classes like 'Good' and 'Severe'
    random_state_val = 42
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=random_state_val,
        stratify=y
    )

    print(f"   [OK] Training Samples : {len(X_train):,} ({len(X_train) / len(df) * 100:.1f}%)")
    print(f"   [OK] Test Samples     : {len(X_test):,} ({len(X_test) / len(df) * 100:.1f}%)")
    print(f"   [OK] Stratified Split : Preserved exact class proportions in both splits.")
    print(f"   [OK] Random Seed      : {random_state_val} (ensures full reproducibility)")

    # -------------------------------------------------------------------------
    # STEP 4: MODEL TRAINING (Random Forest Classifier)
    # -------------------------------------------------------------------------
    print("\n[Step 4/7] Training Random Forest Classifier:")
    print("   - Number of Trees (n_estimators) : 200")
    print("   - Class Weighting (class_weight) : 'balanced'")
    print("     (Compensates for class imbalance so rare classes like 'Severe' are not ignored)")
    print("   - Fitting 200 decision trees on training data...")

    rf_model = RandomForestClassifier(
        n_estimators=200,
        class_weight="balanced",
        random_state=random_state_val,
        n_jobs=-1  # Utilize all available CPU cores for faster training
    )

    start_time = time.time()
    rf_model.fit(X_train, y_train)
    training_duration = time.time() - start_time
    print(f"   [OK] Model training completed in {training_duration:.2f} seconds.")

    # -------------------------------------------------------------------------
    # STEP 5: EVALUATION ON HELD-OUT TEST SET
    # -------------------------------------------------------------------------
    print("\n[Step 5/7] Evaluating Model Performance on Held-Out Test Set:")
    y_pred = rf_model.predict(X_test)

    overall_accuracy = accuracy_score(y_test, y_pred)
    print(f"   [OK] Overall Test Accuracy: {overall_accuracy * 100:.2f}%\n")

    # Defined category order (logical progression from best to worst air quality)
    category_order = ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]
    # Filter to only categories actually present in y
    present_categories = [cat for cat in category_order if cat in np.unique(y_test)]

    print("Detailed Per-Class Classification Report:")
    report_dict = classification_report(
        y_test,
        y_pred,
        labels=present_categories,
        output_dict=True,
        zero_division=0
    )

    # Format per-class table
    print(f"   {'AQI Category':<15} {'Precision (%)':>14} {'Recall (%)':>12} {'F1-Score (%)':>14} {'Support':>10}")
    print("   " + "-" * 67)
    for cat in present_categories:
        metrics = report_dict[cat]
        prec = metrics["precision"] * 100
        rec = metrics["recall"] * 100
        f1 = metrics["f1-score"] * 100
        sup = int(metrics["support"])
        print(f"   {cat:<15} {prec:>13.2f}% {rec:>11.2f}% {f1:>13.2f}% {sup:>10,}")
    print("   " + "-" * 67)
    macro_f1 = report_dict["macro avg"]["f1-score"] * 100
    weighted_f1 = report_dict["weighted avg"]["f1-score"] * 100
    print(f"   {'Macro Average':<15} {report_dict['macro avg']['precision']*100:>13.2f}% {report_dict['macro avg']['recall']*100:>11.2f}% {macro_f1:>13.2f}% {len(y_test):>10,}")
    print(f"   {'Weighted Avg':<15} {report_dict['weighted avg']['precision']*100:>13.2f}% {report_dict['weighted avg']['recall']*100:>11.2f}% {weighted_f1:>13.2f}% {len(y_test):>10,}")

    # Confusion Matrix
    print("\nConfusion Matrix (Rows = Actual True Category, Columns = Model Prediction):")
    conf_matrix = confusion_matrix(y_test, y_pred, labels=present_categories)
    cm_df = pd.DataFrame(conf_matrix, index=present_categories, columns=present_categories)

    header_cols = "".join([f"{cat[:7]:>9}" for cat in present_categories])
    print(f"   {'Actual \\ Pred':<15}{header_cols}")
    print("   " + "-" * (15 + 9 * len(present_categories)))
    for cat in present_categories:
        row_vals = "".join([f"{cm_df.loc[cat, pred]:>9,}" for pred in present_categories])
        print(f"   {cat:<15}{row_vals}")

    # -------------------------------------------------------------------------
    # STEP 6: SAVE TRAINED ARTIFACTS
    # -------------------------------------------------------------------------
    print("\n[Step 6/7] Saving Trained Artifacts:")
    model_export_path = project_dir / "aqi_model.joblib"
    features_export_path = project_dir / "feature_names.joblib"

    joblib.dump(rf_model, model_export_path)
    joblib.dump(mandatory_features, features_export_path)

    print(f"   [OK] Trained model saved to       : {model_export_path.name} ({model_export_path.stat().st_size / (1024*1024):.2f} MB)")
    print(f"   [OK] Feature names saved to       : {features_export_path.name}")
    print(f"   [OK] Saved input feature ordering : {mandatory_features}")

    # -------------------------------------------------------------------------
    # STEP 7: FINAL LABELED SUMMARY REPORT (FOR PROJECT DOCUMENTATION)
    # -------------------------------------------------------------------------
    print("\n" + "=" * 75)
    print(">> [Step 7/7] FINAL RESULTS SUMMARY REPORT (READY FOR DOCUMENTATION)")
    print("=" * 75)
    print(f"""
PROJECT SUMMARY & SPECIFICATIONS:
---------------------------------
* Dataset Used:
  - Source file: datasets/station_day_cleaned.csv
  - Total records analyzed: {total_rows:,}
  - Total features in cleaned dataset: {len(df.columns)}

* Input Feature Selection (Baseline Model):
  - Model Inputs ({len(mandatory_features)}): {', '.join(mandatory_features)}
  - Selection Rationale: Matches Punjab's official 6-parameter AQI formula.
  - Deliberately Excluded ({len(extended_pollutants)}): {', '.join(extended_pollutants)}
  - Exclusion Rationale: Retained in dataset for subsequent cross-sensor adaptability experiments.

* Dataset Partitioning:
  - Train Set Size: {len(X_train):,} samples (80.0%)
  - Test Set Size:  {len(X_test):,} samples (20.0%)
  - Split Methodology: Stratified split (random_state={random_state_val}) preserving class proportions.

* Algorithm Configuration:
  - Classifier: RandomForestClassifier
  - Number of Estimators: 200 trees
  - Class Weighting: 'balanced' (counteracts majority-class bias toward 'Moderate' and 'Satisfactory')

* Baseline Model Performance on Test Set:
  - Overall Accuracy: {overall_accuracy * 100:.2f}%
  - Macro F1-Score:   {macro_f1:.2f}%
  - Weighted F1-Score:{weighted_f1:.2f}%

* Per-Category Performance Breakdown:
""")
    for cat in present_categories:
        m = report_dict[cat]
        print(f"  * {cat:<14}: Precision = {m['precision']*100:>5.2f}% | Recall = {m['recall']*100:>5.2f}% | F1 = {m['f1-score']*100:>5.2f}% (Support: {int(m['support']):,})")

    print("""
* Exported Artifacts:
  - aqi_model.joblib (trained Random Forest model)
  - feature_names.joblib (ordered input features)
===========================================================================
[OK] Model training and evaluation completed successfully!
""")

    sys.stdout = logger.terminal
    logger.close()


if __name__ == "__main__":
    main()
