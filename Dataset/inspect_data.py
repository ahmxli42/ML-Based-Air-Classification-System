from pathlib import Path
import pandas as pd

# List every dataset file we want to check
files = [
    "city_day.csv",
    "city_hour.csv",
    "station_day.csv",
    "station_hour.csv",
    "stations.csv",
]

# Determine the folder containing the dataset files (current folder or subfolder)
if (Path(__file__).parent / "city_day.csv").exists():
    folder = Path(__file__).parent
elif (Path(__file__).parent / "Dataset" / "city_day.csv").exists():
    folder = Path(__file__).parent / "Dataset"
elif (Path(__file__).parent / "datasets" / "city_day.csv").exists():
    folder = Path(__file__).parent / "datasets"
else:
    folder = Path(__file__).parent

for filename in files:
    path = folder / filename
    print("=" * 60)
    print(f"FILE: {filename}")
    print("=" * 60)

    df = pd.read_csv(path, low_memory=False)

    # Basic size of the file
    print(f"Total rows: {df.shape[0]}")
    print(f"Total columns: {df.shape[1]}")
    print(f"Column names: {list(df.columns)}")
    print()

    # Missing values per column
    print("Missing values per column:")
    missing = df.isnull().sum()
    missing_percent = (missing / len(df) * 100).round(1)
    for col in df.columns:
        if missing[col] > 0:
            print(f"  {col}: {missing[col]} missing ({missing_percent[col]}%)")
    if missing.sum() == 0:
        print("  None — this file has no missing values.")
    print()

    # Duplicate rows
    duplicate_count = df.duplicated().sum()
    print(f"Duplicate rows: {duplicate_count}")
    print()