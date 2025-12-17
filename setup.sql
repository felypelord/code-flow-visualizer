-- Create database
CREATE DATABASE codeflow;

-- Create user
CREATE USER codeflow_user WITH PASSWORD 'Felype123!Secure';

-- Set role properties
ALTER ROLE codeflow_user SET client_encoding TO 'utf8';
ALTER ROLE codeflow_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE codeflow_user SET default_transaction_deferrable TO on;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE codeflow TO codeflow_user;

-- Connect to codeflow and grant schema privileges
\c codeflow
GRANT ALL PRIVILEGES ON SCHEMA public TO codeflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO codeflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO codeflow_user;
