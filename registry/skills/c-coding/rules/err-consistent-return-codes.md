# err-consistent-return-codes

> Pick one return-code convention per module/library and apply it consistently

## Why It Matters

Mixing conventions — some functions return `0` for success, others return `1`, others return a pointer that's `NULL` on failure, others set a global error flag — forces every caller to remember which rule applies to which function. A single, predictable convention lets callers write correct error handling on autopilot.

## Bad

```c
int  open_conn(const char *host);       /* returns 1 on success here... */
int  send_data(int fd, const void *b, size_t n);  /* ...but 0 on success here */
void *read_response(int fd);             /* NULL on failure, but what about partial reads? */
```

## Good

```c
/* Convention for this library: 0 == success, negative == -errno-style failure,
 * documented once in the header and applied everywhere. */
int conn_open(const char *host, struct conn **out);
int conn_send(struct conn *c, const void *buf, size_t n);
int conn_recv(struct conn *c, void *buf, size_t n, size_t *out_n);

int rc = conn_open("example.com", &c);
if (rc != 0) {
    fprintf(stderr, "conn_open failed: %s\n", strerror(-rc));
    return rc;
}
```

## Common Conventions (Pick One, Document It)

| Convention | Success | Failure |
|------------|---------|---------|
| POSIX-style | `0` | `-1`, check `errno` |
| Negative errno | `0` | negative `-errno` value, no global state |
| Boolean | nonzero/`true` | `0`/`false`, detail via out-param |
| Sentinel pointer | valid pointer | `NULL`, detail via `errno` or last-error function |

## See Also

- [err-errno-usage](err-errno-usage.md) - Using `errno` correctly within a chosen convention
- [err-error-enum-not-magic-int](err-error-enum-not-magic-int.md) - Naming your error codes
- [api-error-propagation-design](api-error-propagation-design.md) - Designing this at the API level
