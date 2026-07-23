# anti-over-gstring

> Don't use `GString` when a plain `String` will do

## Why It Matters

Double-quoted strings create `GString` objects eagerly, even without interpolation placeholders. `GString` is mutable and has different `hashCode`/`equals` semantics than `String`, which can cause subtle bugs in map lookups and comparisons.

## Bad

```groovy
def status = "active"                  // GString — waste of allocation
def sql = "SELECT * FROM users"        // GString
def path = "/api/v1/users"            // GString

// GString hashCode bug
def mapKey = "key_${1}"               // "key_1" as GString
def map = [(mapKey): 'value']
assert map["key_1"] != null           // May fail! GString ≠ String as map key
```

## Good

```groovy
def status = 'active'                 // Plain String
def sql = 'SELECT * FROM users'
def path = '/api/v1/users'

// Only use GString when interpolation is needed
def greeting = "Hello, ${user.name}"
def url = "https://api.example.com/users/${userId}"

// If you need a GString for map key, convert to String
def key = "order_${orderId}".toString()
def map = [(key): order]
assert map["order_123".toString()] == order  // Safe with toString()
```

## See Also

- [perf-no-string-gstrings](perf-no-string-gstrings.md) - Use single-quoted strings when possible
- [perf-string-builder](perf-string-builder.md) - Use StringBuilder over + in loops
- [err-groovy-truth](err-groovy-truth.md) - Understand Groovy truth
