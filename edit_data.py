import pandas as pd
import random
import math

def generate_random_sectors():
    # Decide random number of sectors (2-5)
    num_sectors = random.randint(2, 5)
    
    remaining_angle = 2 * math.pi
    remaining_probability = 1.0
    sectors = []
    
    # Generate sectors
    for i in range(num_sectors - 1):
        # Random angle that doesn't exceed remaining angle
        angle = random.uniform(0, remaining_angle)
        # Random probability that doesn't exceed remaining probability
        prob = random.uniform(0, remaining_probability)
        
        sectors.append((angle, prob))
        remaining_angle -= angle
        remaining_probability -= prob
    
    # Add final sector with remaining angle and probability
    sectors.append((remaining_angle, remaining_probability))
    
    return sectors

try:
    # Read the CSV file
    df = pd.read_csv('2024-11-metropolitan-street.csv')
    
    # Remove specified columns
    columns_to_remove = ['Crime ID', 'LSOA code', 'Falls within','Reported by']
    df = df.drop(columns=columns_to_remove)
    
    # Rename LSOA code column to borough
    df = df.rename(columns={'LSOA name': 'borough'})

    # Remove code at end of borough column entries 
    df['borough'] = df['borough'].str.replace(r'\s+\d{3}[A-Z]$', '', regex=True)
    
    
    # Generate random sectors for each row
    df['escape_sectors'] = [generate_random_sectors() for _ in range(len(df))]
    
    # Save the modified DataFrame to a new CSV
    df.to_csv('modified_metropolitan_street.csv', index=False)
    
    print("CSV file has been successfully modified and saved!")

except FileNotFoundError:
    print("Error: The input CSV file was not found.")
except Exception as e:
    print(f"An error occurred: {str(e)}")