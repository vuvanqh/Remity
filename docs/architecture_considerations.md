# Stock Market Service — Assumptions, Risks and Design Notes

## Scope Assumptions

### In Scope
This solution covers:

- Wallet portfolio management
- Bank inventory management
- Buy/sell stock operations
- Audit logging
- High availability
- Concurrency correctness
- Fault tolerance through `/chaos`

### Out of Scope (per specification)

The specification does not define:

- Authentication
- Authorization
- Wallet ownership
- User identity
- Funds / balances
- Order books
- Price fluctuations

### Assumption
`wallet_id` is treated as an externally supplied portfolio identifier, not an authenticated account.

---

# Core Invariant

For each stock:

```text
BankQuantity
+ Sum(All Wallet Holdings)
= Constant
```

No operation may violate this invariant.

---

# Data Model

## Stocks (Bank Inventory)

```text
Stocks
- Name (PK)
- Quantity
```

## Wallets

```text
Wallets
- WalletId (PK)
```

## Wallet Holdings

```text
WalletHoldings
- WalletId (FK)
- StockName (FK)
- Quantity
```

Unique constraint:

```text
(WalletId, StockName)
```

## Audit Log

```text
AuditLog
- LogId (Identity)
- OperationType
- WalletId
- StockName
- Timestamp
```

Log ordering is determined by:

```text
LogId
```

not timestamps.

---

# Transactional Guarantees

## Buy Operation (Atomic)

Must execute as one transaction:

```text
1. Verify stock exists
2. Verify bank has quantity > 0
3. Decrement bank inventory
4. Increment wallet holding
5. Insert audit log
6. Commit
```

---

## Sell Operation (Atomic)

```text
1. Verify wallet has stock
2. Decrement wallet holding
3. Increment bank inventory
4. Insert audit log
5. Commit
```

---

# Concurrency Risks

## Concurrent Buy Race

Danger:

```text
Two requests read quantity=1
Both succeed
Inventory oversold
```

Mitigation:

- Atomic conditional updates (`WHERE quantity > 0`)
- Transactions
- Database-level write guarantees

---

## Concurrent Sell Race

Danger:

```text
Wallet has 1 share
Two sells execute simultaneously
Possible underflow / double-sell
```

Mitigation:

- Lock wallet-stock row

---

# Deadlock Risk

Potential:

Transaction A:

```text
Lock Wallet
Lock Bank
```

Transaction B:

```text
Lock Bank
Lock Wallet
```

Deadlock possible.

## Rule

Always acquire locks in fixed order:

```text
1. Bank row
2. Wallet holding row
```

---

# Auto-Creation Race

Specification:

```text
If wallet does not exist, create it.
```

Risk:

Two concurrent first requests attempt creation.

Mitigation:

- Unique wallet constraint
- Upsert pattern
- Safe create-if-not-exists logic

---

# Stock Existence Semantics

Distinguish:

## Stock does not exist

```http
404 Not Found
```

## Stock exists but bank quantity = 0

```http
400 Bad Request
```

Separate concepts:

```text
Exists != Available
```

---

# Audit Log Rules

Log only successful operations.

Failed operations must not be logged.

Audit log write occurs in same transaction as state mutation.

---

# High Availability Assumptions

Service is stateless.

Persistent shared database is system source of truth.

Multiple instances may run behind a load balancer.

Failure of one instance must not impact system availability.

---

# /chaos Assumptions

Endpoint:

```http
POST /chaos
```

Assumption:

- Terminates only the instance serving the request
- In-flight DB transactions rollback automatically
- Other instances remain available

---

# Consistency Over Performance

Given:

```text
No more than 10000 operations
```

Priority is:

1. Correctness
2. Consistency
3. Fault tolerance

Performance optimization is secondary.

---

# Database Concerns Considered

- Transaction atomicity
- Isolation levels
- Lost update prevention
- Deadlock prevention
- Lock ordering
- Retry handling (optional deadlock retry)
- Shared persistent state

---

# Administrative Endpoint Notes

## POST /stocks

Interpreted as administrative inventory reset.

Potentially dangerous because arbitrary resets can violate conservation invariant.

Assumption:

- Administrative operation allowed by specification.
- Used intentionally.

---

# Potential Extensions (Not Required)

Possible production-grade additions intentionally omitted:

- Authentication / authorization
- Idempotency keys for retry safety
- Event sourcing
- Distributed locking
- Message-based audit stream
- Optimistic concurrency versioning

Excluded to remain aligned with assignment scope.