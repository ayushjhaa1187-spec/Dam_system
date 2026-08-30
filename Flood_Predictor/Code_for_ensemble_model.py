import os
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import VotingRegressor

#  3 Boosting Algorithms
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from catboost import CatBoostRegressor

# 1. Data Load 
csv_path = "flood.csv"
if not os.path.exists(csv_path):
    alt_paths = [
        os.path.join(os.path.dirname(__file__), "flood.csv"),
        os.path.join(os.path.dirname(__file__), "..", "flood.csv"),
        os.path.join("Flood_Predictor", "flood.csv"),
        os.path.join(os.path.dirname(__file__), "..", "Flood_Predictor", "flood.csv"),
    ]
    for p in alt_paths:
        if os.path.exists(p):
            csv_path = p
            break

df = pd.read_csv(csv_path)
print(f"Loaded dataset from '{csv_path}' with shape: {df.shape}")

# Defining Target and Features
X = df.drop(columns=['FloodProbability'])
y = df['FloodProbability']

# 3. Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Models Define 
xgb = XGBRegressor(n_estimators=200, learning_rate=0.05, random_state=42)
lgb = LGBMRegressor(n_estimators=200, learning_rate=0.05, random_state=42, verbose=-1)
cat = CatBoostRegressor(iterations=200, learning_rate=0.05, verbose=0, random_state=42)

# 5. Ensemble (Voting) 
ensemble = VotingRegressor(estimators=[('xgb', xgb), ('lgb', lgb), ('cat', cat)])
ensemble.fit(X_train, y_train)

y_pred = ensemble.predict(X_test)
r2 = r2_score(y_test, y_pred) * 100
mse = mean_squared_error(y_test, y_pred) * 100
mae = mean_absolute_error(y_test, y_pred) * 100

print(f"[SUCCESS] Final Ensemble Model Accuracy (R² Score): {r2:.2f}%")
print(f"[SUCCESS] Final Ensemble Model Mean Square error (MSE Score): {mse:.4f}%")
print(f"[SUCCESS] Final Ensemble Model Accuracy (MAE Score): {mae:.4f}%")
