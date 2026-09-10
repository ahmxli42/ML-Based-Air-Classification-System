from pathlib import Path
import pandas as pd

dataset_path = Path(__file__).parent / "city_day.csv"
df = pd.read_csv(dataset_path)  # this is the main file in that Kaggle dataset
print(df.shape)        # how many rows and columns
print(df.head())       # first few rows
print(df.info())       # data types and how many missing values per column

df = df.dropna(subset=["AQI"])
pollutant_cols = ["PM2.5", "PM10", "NO", "NO2", "NOx", "NH3", "CO", "SO2", "O3", "Benzene", "Toluene", "Xylene"]
for col in pollutant_cols:
    df[col] = df[col].fillna(df[col].mean())   #replace missing vals with column mean

df = df.drop_duplicates()

print(df[pollutant_cols].describe()) # shows min, max and average for each pollutant

print(df["AQI Bucket"].value_counts()) # shows how many rows fall into each category

df.to_csv("city_day_cleaned.csv", index=False)  # create a new cleaned file 
print("clean dataset saved as city_day_cleaned.csv")
