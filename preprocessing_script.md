Write a Python data cleaning script (clean_data.py) for the Air Quality Classification project. The script should load datasets/station_day.csv and produce a fully cleaned, model-ready dataset, following these exact requirements:

1. Load and initial inspection

Load the CSV, print total rows, total columns, and column data types
Print a missing-value count and percentage for every column before any cleaning happens, so the report is auditable

2. Column handling (revised — supervisor wants these retained for the adaptability phase)

Keep ALL columns: StationId, Date, PM2.5, PM10, NO, NO2, NOx, NH3, CO, SO2, O3, Benzene, Toluene, Xylene, AQI, AQI_Bucket — do not drop any pollutant columns during cleaning
Define two separate feature lists in the script as named constants: MANDATORY_POLLUTANTS = ["PM2.5", "PM10", "SO2", "NO2", "CO", "O3"] (used for the current baseline model, matching Punjab's official AQI formula) and EXTENDED_POLLUTANTS = ["NO", "NOx", "NH3", "Benzene", "Toluene", "Xylene"] (retained, cleaned, and set aside for the upcoming adaptability experiments)
Apply the same missing-value handling (per-station median imputation, with a 30%-missing warning) to the extended pollutants too, but flag in the printed report that Xylene (~80% missing at station level) will need explicit caveats whenever it's actually used later, since that much imputation makes it a weak signal regardless of the use case 

3. Handle missing values, column by column, not with one blanket rule

Drop any row where AQI or AQI_Bucket is missing — these are the labels, and a row without a label can't be used for training or evaluation
For the six pollutant columns (PM2.5, PM10, NO2, SO2, CO, O3), impute missing values using the median, not the mean, since pollutant data is right-skewed (a few extreme pollution days pull the mean upward) — calculate and print the missing percentage per pollutant column first, and print a warning if any column exceeds 30% missing, since heavy imputation on such a column should be flagged as a caveat in the final report, not silently treated the same as a lightly-missing column
Impute missing values per station where possible (i.e., fill a station's missing PM2.5 with that station's own median, not the global median), falling back to the global median only if a station has no valid readings at all for that pollutant — this keeps location-specific pollution baselines intact rather than flattening everything toward a national average

4. Remove duplicates

Drop fully duplicate rows
Also check for and report duplicate (StationId, Date) pairs specifically, since that would mean two conflicting readings for the same station on the same day — print how many were found before removing them (keep the first occurrence)

5. Handle anomalies and physically impossible values — do this carefully, not aggressively

Remove rows where any pollutant value is negative (physically impossible — a clear sensor/data error, not a real reading)
Do NOT remove statistically extreme high values (e.g., a very high PM2.5 spike) just because they're outliers — these are likely genuine severe pollution events, which is exactly the "unseen/extreme condition" data your project's adaptability work cares about preserving, not discarding. Only flag (print, don't delete) values above a sanity-check ceiling (e.g., PM2.5 above 1000 µg/m³) for manual review, since that's likely a sensor malfunction rather than a real reading, but don't auto-delete without printing what was flagged and why
Cross-check each row's individual pollutant values against its AQI_Bucket label for obvious contradictions (e.g., all six pollutants very low but labeled "Severe") and print a count of how many such mismatched rows exist, without automatically deleting them — this is useful diagnostic information for the report, not necessarily an error to silently fix

6. Feature engineering

Parse the Date column into a proper datetime type
Extract a Month and Season feature from the date (define Season using Punjab's actual pattern: Oct-Nov as "Smog Season," Dec-Feb as "Winter," Mar-May as "Spring," Jun-Sep as "Monsoon/Summer") — this ties directly into the seasonal crop-burning research already done for this project

7. Class balance reporting

Print the count and percentage of rows per AQI_Bucket category, clearly showing the imbalance (fewer "Good" and "Severe" rows relative to "Moderate"/"Satisfactory") — this should be printed, not silently handled, since the imbalance itself is a documented finding in the project's research and should be visible in cleaning output for the report

8. Output

Save the cleaned dataset as datasets/station_day_cleaned.csv
Print a final before/after summary: starting row count, ending row count, how many rows were removed and why (missing labels vs. duplicates vs. invalid negative values), and the final class distribution

9. Code quality requirements

Every cleaning step should be a separate, named function (e.g., handle_missing_pollutants(), remove_invalid_values(), add_seasonal_features()) rather than one long block, so each decision is traceable and testable independently
Add a docstring at the top of the file summarizing what the script does and referencing that column/imputation choices were made deliberately (not defaults) based on the project's prior research into Punjab's AQI formula and data-quality gaps
Print a clear, labeled summary report at the end (not just scattered print statements) so it can be copy-pasted directly into the project documentation

10. Generate a Preprocessing Report

After all cleaning steps are complete, the script should generate a separate, clearly formatted report file (preprocessing_report.txt or .md) summarizing exactly what was done and what the real numbers were — written so it can be pasted directly into the project documentation without further editing. The report must include, with actual computed values (not placeholders or vague language):

Starting state: total rows and columns in the raw file, and the missing-value count and percentage for every column before cleaning
Rows removed and why, broken down by reason: how many rows were dropped for missing AQI/AQI_Bucket labels, how many exact duplicate rows were removed, how many duplicate (StationId, Date) pairs were found and resolved, and how many rows were removed for containing a negative/impossible pollutant value — each as its own labeled count, not a single combined total
Imputation summary: for each pollutant column (mandatory and extended), the exact percentage that was missing and therefore imputed, clearly flagging any column that exceeded the 30% threshold as "heavily imputed — treat with caution"
Flagged-but-kept values: how many extreme high readings were flagged as possible sensor errors above the sanity ceiling, and how many label-mismatch rows were found (pollutants inconsistent with their AQI_Bucket) — stated explicitly as "flagged, not removed" so it's clear these remain in the dataset
Final state: total rows and columns after cleaning, and the exact row count and percentage retained from the original (e.g., "108,035 → 87,025 rows, 80.6% retained")
Final class distribution: the exact count and percentage of rows in each AQI_Bucket category, so the class imbalance is documented with real numbers rather than a general statement
Feature summary: confirmation of which columns were engineered (Month, Season) and which pollutant set is mandatory vs. extended, so it's clear what's ready for the baseline model versus what's reserved for the adaptability phase

The report should read as a standalone, professional summary — structured with clear section headers, real numbers throughout, and no vague language like "some rows were removed" or "most values were filled" — every claim in the report must be backed by an exact number the script itself computed.

Build this now as a complete, runnable script.


