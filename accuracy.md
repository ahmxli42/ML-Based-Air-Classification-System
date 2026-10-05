Write a Python script (preprocess_v2.py) that upgrades the existing cleaned dataset with the following improvements, and critically, validates its own biggest change rather than applying it blindly.

1. Load and run existing cleaning
Load datasets/station_day.csv and apply the same base cleaning already established: per-station median imputation for missing values (mandatory + extended pollutants), negative values treated as invalid/missing before imputation, duplicate and duplicate-(StationId, Date) removal.

2. Recompute AQI_Bucket from the six pollutant values — using the official CPCB sub-index formula

For each of PM2.5, PM10, SO2, NO2, CO, O3, calculate a sub-index using CPCB's published breakpoint tables (concentration range → index range), with linear interpolation within each band
Overall AQI = the maximum of the six sub-indices (standard CPCB method)
Map the final AQI value to a category using the standard bounds: 0-50 Good, 51-100 Satisfactory, 101-200 Moderate, 201-300 Poor, 301-400 Very Poor, 401+ Severe

3. Mandatory validation step — do not skip this
Before replacing the dataset's original label, compare the recomputed label against the original AQI_Bucket for every row, and print:

The exact count and percentage of rows where the label changed
A random sample of 15-20 mismatched rows, showing the six pollutant values, the original AQI column, the original AQI_Bucket, and the newly recomputed AQI value and category side by side — so a human can visually sanity-check whether the recomputation looks correct, rather than trusting it blindly
Specifically check and report: how many mismatches are cases where the original AQI_Bucket doesn't even match the original AQI number under the standard bounds above (this would indicate the source dataset has its own internal labeling inconsistencies, separate from anything our recomputation does)

If the mismatch rate is above 20%, print a clear warning in the output: "High mismatch rate — verify breakpoint table accuracy and whether the original dataset used additional pollutants (e.g. NH3) or different time-averaging before trusting this recomputation."

4. Add lag features
For each of the six mandatory pollutants, add a _lag1 column containing that station's previous day's value (grouped by StationId, sorted by Date). Add AQI_lag1 the same way. Fill the first day per station (which has no prior day) with that station's own median, falling back to the global median.

5. Add seasonal features
Parse Date, extract Month, and derive Season using Punjab's actual pattern: Oct-Nov = "Smog Season", Dec-Feb = "Winter", Mar-May = "Spring", Jun-Sep = "Monsoon/Summer".

6. Add the PM2.5/PM10 ratio feature
PM25_PM10_ratio = PM2.5 / PM10, handling division-by-zero, filled with the column median where undefined.

7. Save output and print a full before/after summary
Save as datasets/station_day_v2.csv. Print starting row/column counts, the label mismatch statistics from step 3, final class distribution, and the full list of new columns added.

8. Retrain and compare
Using the same Random Forest configuration as the existing baseline (200 trees, class_weight="balanced", 80/20 stratified split, random_state=42), train two versions: one using only the original six mandatory pollutants (replicating the current 77.31% baseline for a fair comparison), and one using the six mandatory pollutants plus the new lag, seasonal, and ratio features. Print both accuracy results side by side, plus the full per-class precision/recall/F1 for the improved version, so the actual impact of the new features is directly measurable.

Build this now as a complete, runnable script.