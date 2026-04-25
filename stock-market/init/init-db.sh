#!/bin/bash

/opt/mssql/bin/sqlservr &

echo "Waiting for SQL Server..."

until /opt/mssql-tools18/bin/sqlcmd \
   -S localhost \
   -U sa \
   -P "$SA_PASSWORD" \
   -C \
   -Q "SELECT 1" > /dev/null 2>&1
do
   sleep 2
done

echo "Creating database if missing..."

/opt/mssql-tools18/bin/sqlcmd \
   -S localhost \
   -U sa \
   -P "$SA_PASSWORD" \
   -C \
   -i /init/init-db.sql

echo "Database initialization complete."

wait