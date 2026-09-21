Write a Python script (train_model.py) that trains and evaluates the baseline air quality classification model for the project, using the already-cleaned dataset. Follow these exact requirements:

1. Load the cleaned data

Load datasets/station_day_cleaned.csv (the output of the preprocessing pipeline) — do not re-implement cleaning logic here; this script assumes the data is already clean
Print the row count and the class distribution of AQI_Bucket to confirm what's being trained on

2. Feature selection

Use only the six mandatory pollutants as the model's input features: PM2.5, PM10, SO2, NO2, CO, O3 — these match Punjab's official AQI formula
The extended pollutants (NO, NOx, NH3, Benzene, Toluene, Xylene) must remain in the loaded dataframe but should NOT be included as model inputs for this baseline — they're reserved for the separate adaptability experiments
The target/label column is AQI_Bucket

3. Train/test split

Split the data 80% train / 20% test using train_test_split
Use stratify=y so the proportion of each AQI category is preserved in both the training and test sets — this matters because of the known class imbalance (fewer "Good" and "Severe" rows)
Set a fixed random_state for reproducibility

4. Train the model

Use RandomForestClassifier with n_estimators=200 and class_weight="balanced" — the balanced weighting is deliberate, to stop the model from just favoring the majority classes ("Moderate," "Satisfactory") given the documented imbalance
Fit only on the training set

5. Evaluate on the held-out test set

Report overall accuracy
Report a full per-class breakdown: precision, recall, and F1-score for every AQI category individually, not just the overall average — this is required specifically because overall accuracy can hide poor performance on rare classes like "Severe," which matters for this project's health-relevance argument
Print a confusion matrix so misclassifications between adjacent categories (e.g., "Poor" predicted as "Moderate") are visible

6. Save the trained artifacts

Save the trained model as aqi_model.joblib
Save the exact list of feature names used (in order) as feature_names.joblib, so any script loading the model later knows the correct input order

7. Generate a results report

Print a clear, labeled summary at the end covering: dataset size and class distribution, train/test split sizes, overall accuracy, and the full per-class precision/recall/F1 table — written so it can be copied directly into project documentation
Explicitly note in the report which pollutants were used (the six mandatory ones) and which were deliberately excluded and why (reserved for adaptability work)

Build this now as a complete, runnable script.