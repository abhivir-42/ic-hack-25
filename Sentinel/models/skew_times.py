import pandas as pd
import random

def generate_skewed_time(prob_night=0.60):
    """
    Generate a random (hour, minute) tuple with 60% probability
    falling between 10 PM - 3 AM, and 40% probability in the rest of the day.
    """
    if random.random() < prob_night:
        # Night period: 10:00 PM to 3:59 AM (6 hours, 360 minutes)
        hour = random.randint(22, 23) if random.random() < 2/6 else random.randint(0, 3)
    else:
        # Day period: 4:00 AM to 9:59 PM (18 hours, 1080 minutes)
        hour = random.randint(4, 21)
    
    minute = random.randint(0, 59)
    return hour, minute

def update_month_column(date_str, prob_night=0.60):
    """
    Given a date-time string of the format 'YYYY-MM-DD-HH-MM', replace
    the HH and MM parts with a newly generated random time (keeping YYYY-MM-DD intact).
    """
    parts = date_str.split("-")
    if len(parts) != 5:
        raise ValueError(f"Unexpected date format: {date_str}")
    date_part = "-".join(parts[0:3])  # keep YYYY-MM-DD unchanged

    # Generate a new random time with 60% bias toward 10 PM - 3 AM
    hour, minute = generate_skewed_time(prob_night=prob_night)
    
    return f"{date_part}-{hour:02d}-{minute:02d}"

# Read the CSV file (change "input.csv" to your actual file)
df = pd.read_csv("sampled_metropolitan_data.csv")

# Update the "Month" column
df["Month"] = df["Month"].apply(lambda x: update_month_column(x, prob_night=0.60))

# Save the updated DataFrame back to a CSV file
df.to_csv("adj_time_samples.csv", index=False)

print("Updated CSV with 60% of times skewed to 10 PM - 3 AM written to 'sampled_metropolitan_data_updated.csv'")
