# Preprocessing & Data Cleaning Audit Report
**Project:** ML-Based Air Quality Classification System  
**Dataset:** Central Pollution Control Board (CPCB) Station-Level Multi-City Monitoring  
**Target Target:** `AQI_Bucket` (6-Tier Categorical Classification)  
**Output Dataset:** `datasets/station_day_cleaned.csv`  

---

## 1. Executive Summary & Retention Metrics

* **Original Raw Observations:** 108,035 rows, 16 columns
* **Final Model-Ready Observations:** 87,025 rows, 18 columns
* **Retention Rate:** **80.6%** (87,025 of 108,035 retained; 21,010 removed)
* **Feature Schema:** 18 total columns (16 original features retained + 2 engineered temporal features)

---

## 2. Row Filtering & Exclusion Breakdown

Every row exclusion was strictly deterministic and tied to dataset integrity requirements:

| Exclusion Reason | Rows Dropped | % of Raw Data | Methodological Rationale |
| :--- | :---: | :---: | :--- |
| **Missing Target Labels (`AQI` / `AQI_Bucket`)** | 21,010 | 19.45% | Unlabeled instances cannot be used for supervised model training or benchmark validation. |
| **Exact Duplicate Observations** | 0 | 0.00% | Redundant rows across all 16 features. |
| **Conflicting `(StationId, Date)` Pairs** | 0 | 0.00% | Multiple discordant telemetry records for the same monitoring node on the same day; first instance retained. |
| **Negative Pollutant Concentrations (< 0)** | 0 | 0.00% | Physical impossibility; represents uncalibrated optical zero-drift or sensor baseline glitch. |
| **Total Excluded Observations** | **21,010** | **19.45%** | All remaining observations contain verified labels and valid non-negative readings. |

---

## 3. Initial Missing-Value Audit (Raw Dataset)

Audited across all 16 raw columns prior to cleaning:

| Feature Name | Column Data Type | Raw Missing Count | Raw Missing Percentage |
| :--- | :--- | :---: | :---: |
| `StationId` | `str` | 0 | 0.00% |
| `Date` | `str` | 0 | 0.00% |
| `PM2.5` | `float64` | 21,625 | 20.02% |
| `PM10` | `float64` | 42,706 | 39.53% |
| `NO` | `float64` | 17,106 | 15.83% |
| `NO2` | `float64` | 16,547 | 15.32% |
| `NOx` | `float64` | 15,500 | 14.35% |
| `NH3` | `float64` | 48,105 | 44.53% |
| `CO` | `float64` | 12,998 | 12.03% |
| `SO2` | `float64` | 25,204 | 23.33% |
| `O3` | `float64` | 25,568 | 23.67% |
| `Benzene` | `float64` | 31,455 | 29.12% |
| `Toluene` | `float64` | 38,702 | 35.82% |
| `Xylene` | `float64` | 85,137 | 78.81% |
| `AQI` | `float64` | 21,010 | 19.45% |
| `AQI_Bucket` | `str` | 21,010 | 19.45% |

---

## 4. Imputation Strategy & Audit Summary

Missing pollutant concentrations were resolved via **two-tier hierarchical median imputation**:
1. **Primary Imputation:** Station-specific median (preserves localized spatial baselines, urban canyon vs. suburban background).
2. **Secondary Fallback:** Global dataset median (applied only if a station lacked any historical observation for that analyte).
*Median imputation was selected over mean imputation due to the strong right-skewness of air pollution concentration distributions.*

| Pollutant Feature | Feature Tier | Pre-Impute NaN | Missing % | Imputation Strategy & Quality Flag |
| :--- | :---: | :---: | :---: | :--- |
| `PM2.5` | Mandatory | 3,488 | 4.01% | Nominal — Nominal Imputation |
| `PM10` | Mandatory | 23,961 | 27.53% | Nominal — Nominal Imputation |
| `SO2` | Mandatory | 9,533 | 10.95% | Nominal — Nominal Imputation |
| `NO2` | Mandatory | 1,566 | 1.80% | Nominal — Nominal Imputation |
| `CO` | Mandatory | 2,896 | 3.33% | Nominal — Nominal Imputation |
| `O3` | Mandatory | 9,598 | 11.03% | Nominal — Nominal Imputation |
| `NO` | Extended | 2,229 | 2.56% | Nominal — Nominal Imputation |
| `NOx` | Extended | 4,555 | 5.23% | Nominal — Nominal Imputation |
| `NH3` | Extended | 29,832 | 34.28% | **HEAVILY IMPUTED (CAUTION)** — WARNING: >30% missing (Heavily imputed — treat with caution) |
| `Benzene` | Extended | 19,787 | 22.74% | Nominal — Nominal Imputation |
| `Toluene` | Extended | 26,324 | 30.25% | **HEAVILY IMPUTED (CAUTION)** — WARNING: >30% missing (Heavily imputed — treat with caution) |
| `Xylene` | Extended | 67,584 | 77.66% | **HEAVILY IMPUTED (CAUTION)** — CRITICAL: ~78% missing (Weak signal, explicit caveat required) |

> **Supervisor / Adaptability Phase Caveat (Xylene):**  
> `Xylene` exhibited **77.66%** missingness at the station level. Although retained and cleaned for the planned multi-gas adaptability experiments, it should carry an explicit caveat in future feature attribution analysis, as the predominant reliance on imputed values yields a weak independent predictive signal.

---

## 5. Flagged-But-Kept Quality Diagnostics

In accordance with strict experimental requirements, **statistically extreme peaks and apparent label mismatches were NOT silently deleted**. Severe pollution events are critical for cross-regional adaptability testing.

### A. Physical Sanity Ceiling Audit (Extreme Spikes)
| Analyte | Ceiling Threshold | Observations Above Ceiling | Action Taken |
| :--- | :---: | :---: | :--- |
| `PM2.5` | 1000.0 µg/m³ | 0 | Flagged as plausible severe event / retained for evaluation |
| `PM10` | 1200.0 µg/m³ | 0 | Flagged as plausible severe event / retained for evaluation |
| `NO` | 400.0 µg/m³ | 3 | Flagged as plausible severe event / retained for evaluation |
| `NO2` | 500.0 µg/m³ | 0 | Flagged as plausible severe event / retained for evaluation |
| `NOx` | 500.0 µg/m³ | 0 | Flagged as plausible severe event / retained for evaluation |
| `NH3` | 500.0 µg/m³ | 0 | Flagged as plausible severe event / retained for evaluation |
| `CO` | 50.0 µg/m³ | 111 | Flagged as plausible severe event / retained for evaluation |
| `SO2` | 500.0 µg/m³ | 0 | Flagged as plausible severe event / retained for evaluation |
| `O3` | 300.0 µg/m³ | 385 | Flagged as plausible severe event / retained for evaluation |
| `Benzene` | 250.0 µg/m³ | 26 | Flagged as plausible severe event / retained for evaluation |
| `Toluene` | 400.0 µg/m³ | 21 | Flagged as plausible severe event / retained for evaluation |
| `Xylene` | 200.0 µg/m³ | 0 | Flagged as plausible severe event / retained for evaluation |

### B. Label Contradiction Cross-Check
* **High Pollutant Spike labeled Good/Satisfactory:** `4` rows (e.g., PM2.5 > 250 µg/m³ recorded during sensor transient or local sub-index anomaly).
* **Pristine Pollutants labeled Poor/Severe:** `7` rows (all 6 mandatory criteria gases within 'Good' limits yet classified in higher bracket).
* **Total Flagged Diagnostic Mismatches:** `11` rows.
* **Resolution:** **Retained in dataset**. Stated explicitly as an auditable artifact of multi-contaminant sub-index max pooling under official CPCB calculation rules.

---

## 6. Final Target Class Distribution (`AQI_Bucket`)

Documented class breakdown across the 87,025 cleaned observations:

| AQI Category | Class Severity Band | Observation Count | Percentage | Research Finding & Imbalance Impact |
| :--- | :--- | :---: | :---: | :--- |
| `Good` | Category Level | 5,510 | 6.33% | **Minority Class** — Requires stratified sampling / weighted loss |
| `Satisfactory` | Category Level | 23,636 | 27.16% | High frequency — Moderate background |
| `Moderate` | Category Level | 29,417 | 33.80% | Modal Class — Standard urban baseline |
| `Poor` | Category Level | 11,493 | 13.21% | Intermediate transition tier |
| `Very Poor` | Category Level | 11,762 | 13.52% | Intermediate transition tier |
| `Severe` | Category Level | 5,207 | 5.98% | **Minority Class** — Requires stratified sampling / weighted loss |

**Key Finding on Class Imbalance:**  
The dataset exhibits pronounced class imbalance: `Moderate` (33.80%) and `Satisfactory` (27.16%) account for over 60% of all records. Conversely, extreme clean events (`Good`: 6.33%) and hazardous spikes (`Severe`: 5.98%) represent minority classes, mandating stratified train-test splits and class-weighted evaluation metrics (Macro F1, Balanced Accuracy) during model training.

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
