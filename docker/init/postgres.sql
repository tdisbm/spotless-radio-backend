DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'spotless_radio') THEN
        CREATE DATABASE spotless_radio;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'spotless') THEN
        CREATE ROLE spotless WITH LOGIN PASSWORD 'hackme';
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE spotless_radio TO spotless;