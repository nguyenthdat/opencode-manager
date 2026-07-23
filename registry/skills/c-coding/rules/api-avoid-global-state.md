# api-avoid-global-state

> Prefer passing explicit state through function parameters (often a context/handle struct) over mutable global variables

## Why It Matters

Global mutable state makes a library's behavior depend on hidden call history, breaks under concurrent use unless every access is separately synchronized, makes unit testing require careful setup/teardown of global state between tests, and prevents a program from using two independent instances of the same library simultaneously.

## Bad

```c
static struct connection *g_current_conn;   /* one connection for the whole process */

void db_connect(const char *dsn) {
    g_current_conn = connection_open(dsn);
}
int db_query(const char *sql) {
    return connection_query(g_current_conn, sql);   /* implicit, hidden dependency */
}
/* Can't have two connections; not safe to call concurrently from two threads. */
```

## Good

```c
typedef struct db_handle db_handle;

db_handle *db_connect(const char *dsn);
int        db_query(db_handle *h, const char *sql);
void       db_close(db_handle *h);

db_handle *primary = db_connect(primary_dsn);
db_handle *replica = db_connect(replica_dsn);
db_query(primary, "SELECT ...");
db_query(replica, "SELECT ...");   /* two independent instances, no shared global */
```

## When Some Global State Is Genuinely Unavoidable

```c
/* Process-wide resources (e.g. a signal handler's state) may need a global,
 * but keep it minimal, clearly documented, and protected if touched from
 * more than one thread or signal context. */
static volatile sig_atomic_t g_shutdown_requested = 0;   /* legitimate, narrow use */
```

## See Also

- [api-opaque-struct-encapsulation](api-opaque-struct-encapsulation.md) - The handle pattern used above
- [conc-mutex-protect-shared-state](conc-mutex-protect-shared-state.md) - Required if global state can't be avoided
- [anti-global-mutable-state](anti-global-mutable-state.md) - The anti-pattern this rule prevents
