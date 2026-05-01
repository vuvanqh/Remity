# Stock Market Service

## Overview

This service implements a simplified stock market system with a focus on:

- correctness under concurrency
- transactional consistency
- high availability
- clear separation of concerns

The system is designed to be deterministic, fault-tolerant, and compliant with the provided API specification.

---

## Initialization

The application is fully containerized and can be started with a single command:

```bash
docker-compose up --build
```

This will:

- build the application image
- start the database
- run migrations
- start the API service

The service will be available at:

```
http://localhost:<PORT>
```

### Configuration (Environment Variables)

Runtime configuration (such as port mappings) is handled via environment variables.

Example `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "${PORT:-3000}:3000"
```

You can override the port at runtime:

```bash
PORT=4000 docker-compose up --build
```

Or define defaults using a `.env` file:

```env
PORT=3000
```

Docker Compose automatically loads variables from `.env`.

This approach allows flexible configuration without modifying the compose file.

### Full Environment Configuration

The application relies on a shared `.env` file for both the API and database services.

An example configuration is provided in `.env.example`:

```env
DB_HOST=localhost
DB_PORT=1433
DB_NAME=stock_market_db
DB_USER=sa
DB_PASSWORD=StrongPassword123!
PORT=3000
```

These variables are used as follows:

- **Database container**
  - `DB_PASSWORD` → SQL Server `SA_PASSWORD`
  - `DB_PORT` → exposed database port (`${DB_PORT}:1433`)

- **API container**
  - `DB_HOST` → database host (set to `db` inside Docker network)
  - `DB_PORT` → internal database port (`1433`)
  - `PORT` → exposed API port (`${PORT}:3000`)

### Notes

- Inside Docker, the API connects to the database using the service name (`db`), not `localhost`
- The `.env` file is shared across services via `env_file`
- Default values can be overridden at runtime without modifying configuration files


---

## Project Structure

- `src/` — application source code
- `docs/architecture_considerations.md` — system design, invariants, and risk analysis
- `docs/concurrency_strategy.md` — detailed concurrency model and reasoning

---

## Design Documentation

This repository includes detailed design documentation explaining architectural decisions and trade-offs.

### Architecture and System Behavior

See:

```
docs/architecture_considerations.md
```

This document describes:

- system invariants
- transactional guarantees
- concurrency risks
- failure scenarios
- data model reasoning

---

### Concurrency Strategy

See:

```
docs/concurrency_strategy.md
```

This document explains:

- the hybrid concurrency model
- why optimistic concurrency is used for trading
- why strong isolation is used for administrative operations
- how correctness is enforced without global locking

---

## Key Design Principles

- Correctness over performance
- Atomic state transitions
- Database-driven consistency guarantees
- Stateless service design for high availability

---

## High Availability

The service is stateless and relies on a shared database.

- multiple instances can run simultaneously
- `/chaos` terminates only a single instance
- other instances continue serving traffic

---

## Summary

This implementation prioritizes:

- strong consistency guarantees
- predictable behavior under concurrency
- minimal contention
- clear and auditable system design

