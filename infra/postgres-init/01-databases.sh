#!/bin/sh
set -eu
for service in identity workspace messaging files notifications calls audit; do
  psql -v ON_ERROR_STOP=1 --username postgres --dbname postgres --set=service_password="$SERVICE_DB_PASSWORD" <<SQL
CREATE ROLE ${service}_app LOGIN PASSWORD :'service_password';
CREATE DATABASE ${service}_db OWNER ${service}_app;
REVOKE CONNECT ON DATABASE ${service}_db FROM PUBLIC;
GRANT CONNECT ON DATABASE ${service}_db TO ${service}_app;
SQL
done
