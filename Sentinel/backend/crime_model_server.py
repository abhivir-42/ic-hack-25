from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model
with open('./criminal_movement_model.pkl', 'rb') as model_file:
    model = pickle.load(model_file)

@app.route('/predict', methods=['POST'])
def predict():
    try: 
        data = request.get_json()
        longitude = data.get('longitude')  # Fix key names
        latitude = data.get('latitude')
        crime_type = data.get('crimeType')

        print("here")

        if longitude is None or latitude is None or crime_type is None:
            return jsonify({'error': 'Invalid input'}), 400
        # Create a sample dictionary
        sample = {
            'Longitude': longitude,
            'Latitude': latitude,
            'Crime type': crime_type,
        }
        sample_df = pd.DataFrame([sample])

        # Make prediction
        prediction = model.predict(sample_df)
        predicted_sectors = []
        for i in range(5):
            angle = prediction[0, i]
            prob = prediction[0, i+5]
            predicted_sectors.append({'angle': angle, 'probability': prob})
        predicted_apprehension_time = prediction[0, -1]

        return jsonify({
            'predicted_sectors': predicted_sectors,
            'predicted_apprehension_time': predicted_apprehension_time
        })  # Convert numpy to list
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')  # Bind to all interfaces
