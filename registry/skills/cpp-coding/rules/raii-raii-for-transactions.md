# raii-raii-for-transactions

> Use RAII for transactional commit/rollback

## Why It Matters

Operations that need "undo on failure, keep on success" semantics (database transactions, multi-step state changes, temporary file writes) map naturally onto RAII: the destructor rolls back by default, and an explicit `commit()` call disarms the rollback. This guarantees rollback happens even when an exception is thrown partway through, without duplicating cleanup logic at every failure point.

## Bad

```cpp
void transfer_funds(Db& db, Account& from, Account& to, int amount) {
    db.begin();
    from.debit(amount);       // If credit() throws, we never rollback
    to.credit(amount);        // Partial state committed to disk!
    db.commit();
}
```

## Good

```cpp
class DbTransaction {
public:
    explicit DbTransaction(Db& db) : db_(db) { db_.begin(); }

    ~DbTransaction() {
        if (!committed_) {
            try { db_.rollback(); } catch (...) { /* best effort */ }
        }
    }

    void commit() {
        db_.commit();
        committed_ = true;
    }

    DbTransaction(const DbTransaction&) = delete;
    DbTransaction& operator=(const DbTransaction&) = delete;

private:
    Db& db_;
    bool committed_ = false;
};

void transfer_funds(Db& db, Account& from, Account& to, int amount) {
    DbTransaction txn(db);
    from.debit(amount);    // If this throws, txn's destructor rolls back
    to.credit(amount);     // Same here
    txn.commit();          // Only reached if both operations succeeded
}
```

## Generalizing to In-Memory State

```cpp
class UndoableEdit {
public:
    explicit UndoableEdit(Document& doc) : doc_(doc), snapshot_(doc.serialize()) {}
    ~UndoableEdit() { if (!kept_) doc_.restore(snapshot_); }
    void keep() noexcept { kept_ = true; }
private:
    Document& doc_;
    std::string snapshot_;
    bool kept_ = false;
};
```

## See Also

- [raii-exception-safety-dtor](raii-exception-safety-dtor.md) - Rollback logic must not throw from the destructor
- [err-strong-exception-guarantee](err-strong-exception-guarantee.md) - Strong guarantee via commit/rollback
- [raii-scope-exit](raii-scope-exit.md) - Lighter-weight scope guards for simpler cleanup
