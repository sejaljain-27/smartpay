import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
import joblib
import os

df = pd.read_csv("data/user_goal_risk_dataset.csv")

X = df[["avg_daily_spend", "days_remaining", "goal_amount"]]
y = df["risk"]

model = LogisticRegression()
model.fit(X, y)

os.makedirs("models", exist_ok=True)
joblib.dump(model, "models/goal_risk_model.pkl")