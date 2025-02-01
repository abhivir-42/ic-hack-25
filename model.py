import pandas as pd
import numpy as np
import ast
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.multioutput import MultiOutputRegressor
import pickle

# =======================================================
# 1. Load Data from a CSV File
# =======================================================

# Specify the path to your CSV file
csv_file = 'sampled_metropolitan_data.csv'  # <-- Update this with your CSV file path
df = pd.read_csv(csv_file)

# =======================================================
# 2. Process the "escape_sectors" Column into a Vector
# =======================================================

def process_escape_sectors(val, max_sectors=5):
    """
    Parse the string value to a list of tuples and ensure a fixed length.
    If there are fewer than max_sectors, pad with (0.0, 0.0);
    if there are more, truncate.
    Returns a flattened list [angle1, prob1, angle2, prob2, ..., angleN, probN].
    """
    try:
        sectors = ast.literal_eval(val)
        if not isinstance(sectors, list):
            sectors = []
    except Exception:
        sectors = []
    # Truncate if needed and pad if too few
    sectors = sectors[:max_sectors]
    if len(sectors) < max_sectors:
        sectors += [(0.0, 0.0)] * (max_sectors - len(sectors))
    # Flatten the list of tuples
    flat = [item for tup in sectors for item in tup]
    return flat

# Create a new column with the flattened escape sectors vector
df['escape_sectors_flat'] = df['escape_sectors'].apply(lambda x: process_escape_sectors(x, max_sectors=5))

# Create individual columns for each element in the flattened vector
for i in range(5):
    df[f'sector_{i+1}_angle'] = df['escape_sectors_flat'].apply(lambda x: x[2*i])
    df[f'sector_{i+1}_prob'] = df['escape_sectors_flat'].apply(lambda x: x[2*i+1])

# =======================================================
# 3. Feature Engineering – Process Date/Time and Select Features
# =======================================================

# Convert the "Month" column into a datetime object.
# The expected format is: YYYY-MM-DD-HH-MM
df['Month_dt'] = pd.to_datetime(df['Month'], format='%Y-%m-%d-%H-%M', errors='coerce')

# Extract time-based features
df['month_num'] = df['Month_dt'].dt.month
df['day'] = df['Month_dt'].dt.day
df['hour'] = df['Month_dt'].dt.hour
df['minute'] = df['Month_dt'].dt.minute

# Define feature and target columns.
feature_cols = ['Longitude', 'Latitude', 'borough', 'Crime type', 'month_num', 'day', 'hour', 'minute']

# Our target is a combination of:
#   - The flattened escape sectors (5 sectors × 2 values = 10 values)
#   - The apprehension_time_minutes (1 value)
target_cols = [f'sector_{i+1}_angle' for i in range(5)] + \
              [f'sector_{i+1}_prob' for i in range(5)] + \
              ['apprehension_time_minutes']

# Drop rows with missing target values (if any)
df = df.dropna(subset=target_cols)

X = df[feature_cols]
y = df[target_cols]

# =======================================================
# 4. Build and Train the Prediction Model
# =======================================================

# Split the data into training and test sets.
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Preprocess numeric features with scaling and categorical features with one-hot encoding.
numeric_features = ['Longitude', 'Latitude', 'month_num', 'day', 'hour', 'minute']
numeric_transformer = StandardScaler()

categorical_features = ['borough', 'Crime type']
categorical_transformer = OneHotEncoder(handle_unknown='ignore')

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ])

# Wrap the GradientBoostingRegressor with MultiOutputRegressor to support multi-output regression.
base_regressor = GradientBoostingRegressor(n_estimators=100, random_state=42, verbose=1)
multi_output_regressor = MultiOutputRegressor(base_regressor)

# Build a pipeline that first preprocesses the data and then fits the multi-output regressor.
model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', multi_output_regressor)
])

# Train the model
model.fit(X_train, y_train)

# Evaluate and print the training and test scores
train_score = model.score(X_train, y_train)
test_score = model.score(X_test, y_test)
print(f"Train Score: {train_score:.4f}, Test Score: {test_score:.4f}")

# =======================================================
# 5. Pickle (Save) the Model
# =======================================================

with open('criminal_movement_model.pkl', 'wb') as f:
    pickle.dump(model, f)

# =======================================================
# 6. Reload the Model and Make a Prediction
# =======================================================

# Load the model back from the pickle file
with open('criminal_movement_model.pkl', 'rb') as f:
    loaded_model = pickle.load(f)

# Create a new sample input (adjust values as needed)
sample = {
    'Longitude': -0.1,
    'Latitude': 51.52,
    'borough': 'Camden',
    'Crime type': 'Burglary',
    'month_num': 9,
    'day': 15,
    'hour': 14,
    'minute': 30
}
sample_df = pd.DataFrame([sample])

# Use the loaded model to predict.
# The output is an array with 11 values:
#   - The first 10 values correspond to the flattened escape sectors (angle, prob pairs for up to 5 sectors)
#   - The last value is the predicted apprehension_time_minutes
prediction = loaded_model.predict(sample_df)

# Unpack the prediction into a list of (angle, probability) tuples and the apprehension time
predicted_sectors = []
for i in range(5):
    angle = prediction[0, i]
    prob = prediction[0, i+5]
    predicted_sectors.append((angle, prob))
predicted_apprehension_time = prediction[0, -1]

print("Predicted Escape Sectors (angle in radians, probability):")
for idx, (angle, prob) in enumerate(predicted_sectors, start=1):
    print(f"  Sector {idx}: Angle = {angle:.3f}, Probability = {prob:.3f}")
print("Predicted Apprehension Time (minutes):", predicted_apprehension_time)
