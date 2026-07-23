# doc-todo-fixme-convention

> Mark known-incomplete or known-broken code with a consistent, greppable `TODO`/`FIXME` tag that includes an owner or issue reference

## Why It Matters

Unmarked shortcuts and known limitations get forgotten and eventually surface as production bugs; a consistent tag format makes every deferred issue greppable project-wide (`grep -rn "FIXME" src/`) and, with an attached issue reference or owner, gives every deferred item a path to actually being resolved instead of silently rotting.

## Bad

```c
int connect_with_retry(const char *host) {
    /* this doesn't handle IPv6 yet, whatever */
    return connect_v4(host);
}

void process(void) {
    /* known race here somewhere but works for now */
    shared_counter++;
}
```

## Good

```c
int connect_with_retry(const char *host) {
    /* TODO(jdoe): add IPv6 support. See issue #482. */
    return connect_v4(host);
}

void process(void) {
    /* FIXME(jdoe): unsynchronized access to shared_counter; needs a mutex.
     * Tracked in issue #501 — do not ship a release without fixing this. */
    shared_counter++;
}
```

## TODO vs FIXME: Use Both Consistently

| Tag | Meaning |
|-----|---------|
| `TODO` | Planned, non-urgent future work; not currently broken |
| `FIXME` | Something is currently wrong/incomplete and needs attention |
| `HACK`  | A deliberate, known-fragile workaround; explain why it exists |

```sh
grep -rn "TODO\|FIXME\|HACK" src/   # project-wide audit of deferred work
```

## See Also

- [doc-comment-why-not-what](doc-comment-why-not-what.md) - Related discipline for meaningful comments
- [err-fail-fast-invariant](err-fail-fast-invariant.md) - A `FIXME` about a known race is a strong signal to fail fast instead of shipping silently
- [doc-changelog-versioning](doc-changelog-versioning.md) - Where resolved FIXMEs should eventually be reflected
