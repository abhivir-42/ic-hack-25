# Crime data gen 
import pandas as pd
import random
import datetime

# Generate random latitude and longitude around London
def random_lat_lon():
    lat = round(random.uniform(51.48, 51.53), 6)  # London's lat range
    lon = round(random.uniform(-0.12, -0.07), 6)  # London's lon range
    return lat, lon

# Sample boroughs in London
boroughs = [
    "City of London", "Camden", "Westminster", "Islington", "Southwark", "Hackney", "Tower Hamlets"
]

# Sample crimes and severity levels
crimes = {
    "Theft": "Low",
    "Burglary": "Medium",
    "Violence and sexual offences": "High",
    "Drugs": "Medium",
    "Public order": "Medium",
    "Bicycle theft": "Low",
    "Shoplifting": "Low",
    "Robbery": "High",
}

# Generate random time of crime and suspect apprehension
def random_time():
    crime_time = datetime.datetime(2024, random.randint(1, 12), random.randint(1, 28), random.randint(0, 23), random.randint(0, 59))
    apprehension_time = crime_time + datetime.timedelta(hours=random.randint(1, 48))  # Within 2 days
    return crime_time, apprehension_time

# Generate dataset
data = []
for _ in range(1000):
    lat, lon = random_lat_lon()
    borough = random.choice(boroughs)
    crime, severity = random.choice(list(crimes.items()))
    crime_time, apprehension_time = random_time()
    apprehension_lat, apprehension_lon = random_lat_lon()
    
    data.append([
        lat, lon, borough, crime, severity, crime_time, apprehension_time, (apprehension_lat, apprehension_lon)
    ])

# Create DataFrame
df = pd.DataFrame(data, columns=[
    "Crime Latitude", "Crime Longitude", "Borough", "Crime Type", "Severity", "Time of Crime",
    "Time of Suspect Apprehension", "Apprehension Location"
])

# Save to CSV
df.to_csv("synthetic_crime_data.csv", index=False)

print("Synthetic dataset generated and saved as synthetic_crime_data.csv")