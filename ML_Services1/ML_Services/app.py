from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

print("LOADING FULL ML SERVICE ")

app = FastAPI(title="ML Services API")

# ======================================================
# TASK 1: EXPENSE CATEGORY PREDICTION
# ======================================================

category_model = joblib.load("models/category_model.pkl")
vectorizer = joblib.load("models/vectorizer.pkl")

class CategoryRequest(BaseModel):
    text: str

@app.post("/predict-category")
def predict_category(req: CategoryRequest):
    X = vectorizer.transform([req.text])
    probs = category_model.predict_proba(X)[0]
    idx = int(np.argmax(probs))

    return {
        "category": category_model.classes_[idx],
        "confidence": float(probs[idx])
    }

# ======================================================
# TASK 2: GOAL RISK PREDICTION
# ======================================================

goal_model = joblib.load("models/goal_risk_model.pkl")

class GoalRequest(BaseModel):
    avg_daily_spend: float
    days_remaining: int
    goal_amount: float

@app.post("/predict-goal-risk")
def predict_goal_risk(req: GoalRequest):
    X = [[req.avg_daily_spend, req.days_remaining, req.goal_amount]]
    risk = goal_model.predict(X)[0]

    return {
        "risk": risk
    }

# ======================================================
# TASK 3: SPENDING BEHAVIOR CLUSTERING
# ======================================================

cluster_model = joblib.load("models/cluster_model.pkl")
cluster_scaler = joblib.load("models/cluster_scaler.pkl")
cluster_labels = joblib.load("models/cluster_labels.pkl")

class ClusterRequest(BaseModel):
    food: float
    shopping: float
    transport: float
    utilities: float

@app.post("/cluster-user")
def cluster_user(req: ClusterRequest):

    values = {
        "Food": req.food,
        "Shopping": req.shopping,
        "Transport": req.transport,
        "Utilities": req.utilities
    }

    total_spend = sum(values.values())

    top_category = max(values, key=values.get)
    top_category_value = values[top_category]

    top_category_percentage = round(
        (top_category_value / total_spend) * 100, 2
    ) if total_spend > 0 else 0.0

    X = [[req.food, req.shopping, req.transport, req.utilities]]
    X_scaled = cluster_scaler.transform(X)
    cluster_id = int(cluster_model.predict(X_scaled)[0])

    return {
        "cluster_id": cluster_id,
        "spender_type": cluster_labels[cluster_id],
        "top_category": top_category,
        "top_category_percentage": top_category_percentage
    }

# ======================================================
# ROOT
# ======================================================

@app.get("/")
def root():
    return {"message": "ML Service API is running"}