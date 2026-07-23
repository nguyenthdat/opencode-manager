# api-out-param-convention

> Order output parameters consistently (after inputs), name them with an `out_`/`_out` convention, and never write to them on failure

## Why It Matters

Out-parameters are a pervasive C idiom for returning multiple values or data too large to return by value, but without a project-wide convention for their position, naming, and failure-mode guarantees, every function call site has to be checked individually to know whether an out-param was actually touched.

## Bad

```c
/* Inconsistent ordering, naming, and unclear write-on-failure semantics */
int parse(int *result, const char *s);        /* out-param first here... */
int lookup(const char *key, int *value);        /* ...but last here */
int compute(const char *s, int *n);              /* does n get written on failure? unclear */
```

## Good

```c
/* Convention: inputs first, out-params last, prefixed `out_`;
 * out-params are left untouched unless the function returns success. */
int str_parse_int(const char *s, int *out_value);
int cache_lookup(const char *key, int *out_value);
int expr_compute(const char *s, int *out_result);

int value;
if (str_parse_int("42", &value) == 0) {
    use(value);   /* safe: value is only meaningful because the call succeeded */
}
```

## Multiple Out-Parameters

```c
int stat_summarize(const int *data, size_t n,
                    double *out_mean, double *out_stddev) {
    if (n == 0) {
        return -EINVAL;   /* out_mean/out_stddev left untouched */
    }
    *out_mean = compute_mean(data, n);
    *out_stddev = compute_stddev(data, n, *out_mean);
    return 0;
}
```

## See Also

- [err-out-param-for-result](err-out-param-for-result.md) - Why status and result should be separated this way
- [ptr-pointer-to-pointer-clarity](ptr-pointer-to-pointer-clarity.md) - When the out-param is itself a pointer
- [name-verb-noun-function-names](name-verb-noun-function-names.md) - Complementary naming discipline
