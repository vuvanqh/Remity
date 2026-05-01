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

The application is containerized and started via a single command.

### Start Command

```bash
./start.sh <PORT>
```

Example:

```bash
./start.sh 4000
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

If no port is provided, a default value is used.

```bash
./start.sh
```

---

### Configuration (Environment Variables)

Runtime configuration is managed via environment variables.

The `PORT` can be overridden at startup, but also has a default defined in `.env`.

Example `docker-compose.yml`:

```yaml
services:
  api:
    ports:
      - "${PORT:-3000}:3000"
```

---

### Environment File

The application uses a shared `.env` file for configuration.

Example (`.env.example`):

```env
DB_HOST=localhost
DB_PORT=1433
DB_NAME=stock_market_db
DB_USER=sa
DB_PASSWORD=StrongPassword123!
PORT=3000
```

Notes:

- The startup script overrides `PORT` when provided
- `.env` acts as a default configuration layer
- Inside Docker, the API connects to the database using the service name (`db`)

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

