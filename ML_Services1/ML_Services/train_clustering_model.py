import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import os

# Load dataset
df = pd.read_csv("data/user_spending_cluster_dataset.csv")

X = df[["food", "shopping", "transport", "utilities"]]

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train KMeans
kmeans = KMeans(n_clusters=5, random_state=42)
kmeans.fit(X_scaled)

# Save model artifacts
os.makedirs("models", exist_ok=True)
joblib.dump(kmeans, "models/cluster_model.pkl")
joblib.dump(scaler, "models/cluster_scaler.pkl")

# ----- INTERPRET CLUSTERS -----
centroids = scaler.inverse_transform(kmeans.cluster_centers_)

cluster_labels = {}

for idx, c in enumerate(centroids):
    # c = [food, shopping, transport, utilities]
    max_val = max(c)
    min_val = min(c)

    # Balanced condition
    if (max_val - min_val) / max_val < 0.25:
        cluster_labels[idx] = "Balanced spender"
    else:
        dominant = np.argmax(c)
        if dominant == 0:
            cluster_labels[idx] = "Food-heavy spender"
        elif dominant == 1:
            cluster_labels[idx] = "Shopping-heavy spender"
        elif dominant == 2:
            cluster_labels[idx] = "Transport-heavy spender"
        elif dominant == 3:
            cluster_labels[idx] = "Utilities-heavy spender"

joblib.dump(cluster_labels, "models/cluster_labels.pkl")

print("=== Cluster Interpretation ===")
for k, v in cluster_labels.items():
    print(f"{k} -> {v}")