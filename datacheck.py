from pathlib import Path
import pandas as pd

# Support both root directory execution and local file location
dataset_path = Path(__file__).parent / "Dataset" / "city_day.csv"
if not dataset_path.exists():
    dataset_path = Path(__file__).parent / "city_day.csv"

df = pd.read_csv(dataset_path)  # this is the main file in that Kaggle dataset
print(df.shape)        # how many rows and columns
print(df.head())       # first few rows
print(df.info())       # data types and how many missing values per column
