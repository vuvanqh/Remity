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
./start.sh <PORT> [INSTANCES]
```

Examples:

```bash
./start.sh 4000 3
./start.sh 5000
```

This will:

- build the application image
- start the database
- run migrations
- start the API service
- scale API instances (minimum 2)

The service will be available at:

```
http://localhost:<PORT>
```

If no arguments are provided:

```bash
./start.sh
```

Defaults:

- `PORT = 3000`
- `INSTANCES = 2`

The number of instances is always enforced to be at least 2 to satisfy high availability requirements.

---

### Configuration (Environment Variables)

Runtime configuration is managed via environment variables.

The `PORT` can be overridden at startup via `./start.sh <PORT>`, while `.env` provides defaults.

Example `docker-compose.yml` (effective setup):

```yaml
services:
  nginx:
    ports:
      - "${PORT:-3000}:3000"
```

Note: The API service does **not** expose ports directly when running multiple replicas.

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

The system achieves high availability through horizontal replication of stateless API instances and a reverse proxy.

### Architecture

```
client → localhost:<PORT> → nginx → api (multiple replicas)
```

### Key Properties

- multiple API instances are started using Docker Compose scaling
- nginx acts as a single entrypoint and distributes traffic
- `/chaos` terminates only one instance
- Docker restart policy ensures the instance is restarted automatically
- other instances continue serving traffic during failure

### Implementation Notes

- API containers are scaled via:

```bash
docker-compose up --build --scale api=<INSTANCES>
```

- The startup script enforces a minimum of 2 instances
- API containers do not expose ports directly
- nginx is the only externally exposed service
- service discovery is handled via Docker internal DNS (`api` resolves to replicas)

- API containers do not expose ports directly
- nginx is the only externally exposed service
- service discovery is handled via Docker internal DNS (`api` resolves to replicas)

This setup provides:

- fault tolerance (instance-level)
- basic self-healing (via restart policy)
- a stable external interface (`localhost:<PORT>`)

---

## Summary

This implementation prioritizes:

- strong consistency guarantees
- predictable behavior under concurrency
- minimal contention
- clear and auditable system design

