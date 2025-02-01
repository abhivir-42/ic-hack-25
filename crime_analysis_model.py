from flask import Flask, render_template, request
import pandas as pd
import folium
import json

app = Flask(__name__)

# Constants
RUNNING_SPEED = 12  # km/h
JOGGING_SPEED = 8   # km/h
WALKING_SPEED = 5   # km/h

def calculate_radius(time_mins, speed_kmh):
    """Calculate radius in meters based on time and speed"""
    return (speed_kmh * (time_mins/60)) * 1000

def create_map(lat, lon, crime_type, location, date, status):
    # Create map centered on incident
    m = folium.Map(location=[lat, lon], zoom_start=15)
    
    # Add main marker
    folium.Marker(
        [lat, lon],
        popup=f"""
            <b>Crime Type:</b> {crime_type}<br>
            <b>Location:</b> {location}<br>
            <b>Status:</b> {status}<br>
            <b>Date:</b> {date}
        """
    ).add_to(m)
    
    # Add the three radius circles
    folium.Circle(
        location=[lat, lon],
        radius=calculate_radius(5, RUNNING_SPEED),
        color='red',
        fill=True,
        fill_opacity=0.2,
        popup='5 min running radius'
    ).add_to(m)
    
    folium.Circle(
        location=[lat, lon],
        radius=calculate_radius(10, JOGGING_SPEED),
        color='orange',
        fill=True,
        fill_opacity=0.2,
        popup='10 min jogging radius'
    ).add_to(m)
    
    folium.Circle(
        location=[lat, lon],
        radius=calculate_radius(15, WALKING_SPEED),
        color='yellow',
        fill=True,
        fill_opacity=0.2,
        popup='15 min walking radius'
    ).add_to(m)
    
    return m

@app.route('/', methods=['GET', 'POST'])
def index():
    # Load data
    df = pd.read_csv('2024-11-city-of-london-street.csv')
    df = df.dropna(subset=['Latitude', 'Longitude'])
    
    # Create incident list for dropdown
    incidents = [f"{row['Crime type']} at {row['Location']} ({row['Month']})" 
                for idx, row in df.iterrows()]
    
    if request.method == 'POST':
        selected_idx = int(request.form.get('incident'))
        row = df.iloc[selected_idx]
        
        # Create map
        m = create_map(
            float(row['Latitude']),
            float(row['Longitude']),
            row['Crime type'],
            row['Location'],
            row['Month'],
            row['Last outcome category']
        )
        
        # Save map to template folder
        m.save('templates/map.html')
        
        return render_template('index.html', 
                             incidents=enumerate(incidents),
                             selected=selected_idx,
                             show_map=True)
    
    return render_template('index.html', 
                         incidents=enumerate(incidents),
                         show_map=False)

if __name__ == '__main__':
    app.run(debug=True)