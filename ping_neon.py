import os
import time
import psycopg2
from psycopg2 import OperationalError


# Default to production connection string, but allow override via env var
NEON_DB_URL = os.getenv(
    "NEON_DB_URL",
    "postgresql://neondb_owner:npg_6FVlUXmA3IQq@ep-mute-bread-adfl61ww-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

if not NEON_DB_URL:
    raise ValueError("Please set the NEON_DB_URL environment variable with your Neon database connection string.")

def ping_neon():
    try:
        with psycopg2.connect(NEON_DB_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                print("Pinged Neon successfully.")
    except OperationalError as e:
        print(f"Failed to connect to Neon: {e}")
    except Exception as e:
        print(f"Error pinging Neon: {e}")

if __name__ == "__main__":
    print("Starting Neon keep-alive pinger. Press Ctrl+C to stop.")
    while True:
        ping_neon()
        time.sleep(180)  # 3 minutes
