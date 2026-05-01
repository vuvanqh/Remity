# Concurrency Strategy

The system uses a hybrid concurrency model tailored to two distinct categories of operations:

1. High-frequency operations (buy / sell)
2. Low-frequency global state updates (setting bank state)

The goal is to guarantee correctness while maximizing throughput and minimizing contention.

---

## 1. Wallet Operations (Buy / Sell)

### Isolation Level

`READ COMMITTED`

### Core Mechanism

Concurrency is controlled using atomic conditional updates at the database level, rather than relying on strong isolation or explicit locks.

### Example

```sql
UPDATE stocks
SET quantity = quantity - 1
WHERE name = ? AND quantity > 0
```

### Reasoning

This query encodes the invariant directly into the write:

- The update only succeeds if stock is available (`quantity > 0`)
- The check and modification occur in a single atomic operation
- The database guarantees that concurrent updates cannot violate this condition

### Resulting Invariants

- **No negative stock** — enforced by the `WHERE` clause
- **No double spending** — only one transaction can decrement a given unit
- **No lost updates** — updates are atomic
- **Consistency across entities** — wallet, bank, and audit log are updated within a single transaction

### Failure Behavior

If multiple transactions compete:

- One succeeds (`rows affected = 1`)
- Others fail (`rows affected = 0`) and return an error

This is intentional:

- avoids blocking
- avoids lock contention
- ensures predictable behavior under load

---

## 2. Wallet Stock Updates

Wallet holdings use a similar pattern:

```sql
UPDATE walletStocks
SET quantity = quantity + 1
WHERE wallet_id = ? AND stock_name = ?
```

If the row does not exist:

- an insert is attempted
- on conflict, the update is retried

This ensures correctness under concurrent creation without requiring locks.

---

## 3. Transaction Boundaries

Each operation (buy / sell) is executed within a single transaction:

- decrement/increment bank stock
- increment/decrement wallet stock
- insert audit log

This guarantees:

- **atomicity** — all steps succeed or none do
- **consistency** — no partial state is ever visible

---

## 4. Bank State Updates

### Isolation Level

`SERIALIZABLE`

### Purpose

Used only when replacing the entire bank state.

### Behavior

- Prevents concurrent modifications of affected rows
- Ensures the update behaves as a single, isolated operation
- Guarantees that no buy/sell operation observes intermediate state

### Reasoning

This operation:

- modifies global system state
- is expected to be infrequent
- prioritizes correctness over throughput

---

## 5. Why SERIALIZABLE is not used for trading

Using `SERIALIZABLE` for buy/sell operations would:

- introduce locking and blocking
- reduce throughput under contention
- increase latency

Instead, correctness is achieved through:

- atomic updates
- database-level guarantees
- transactional grouping

---

## 6. Summary

The system enforces correctness through invariants encoded in database writes, not through global locking.

- High-frequency operations → optimistic concurrency (non-blocking, scalable)
- Global state updates → strong isolation (safe, controlled)

This approach provides:

- strong consistency guarantees
- high throughput under concurrent load
- minimal contention and predictable failure behavior
