-- Initialize additional databases on first container start
-- This runs only when the PGDATA volume is empty
CREATE DATABASE alcohols_test;
-- Ensure the owner remains postgres (default) and all privileges are granted
GRANT ALL PRIVILEGES ON DATABASE alcohols_test TO postgres;
