# perf-no-string-gstrings

> Use single-quoted strings when interpolation not needed

## Why It Matters

Double-quoted strings (`"..."`) create `GString` instances even when no `${...}` interpolation is used, incurring unnecessary object allocation and parsing overhead. Single-quoted strings (`'...'`) are plain `String` literals with no processing overhead.

## Bad

```groovy
def logLevel = "INFO"                 // GString — unnecessary
def status = "active"                 // GString
def separator = ","                   // GString
def sql = "SELECT * FROM users"       // GString

// Silent GString in maps
def config = ["mode": "production"]   // GString value

// Triple-double-quoted — GString
def template = """Hello World"""      // GString with no interpolation
```

## Good

```groovy
def logLevel = 'INFO'                 // Plain String
def status = 'active'
def separator = ','
def sql = 'SELECT * FROM users'

// Single-quoted for map keys/values
def config = ['mode': 'production']

// Use double-quoted only when interpolating
def greeting = "Hello, ${user.name}!"
def logMsg = "[${new Date()}] Processing ${order.id}"

// Multi-line plain strings with triple-single-quotes
def template = '''Hello
World
This is a multi-line
string without interpolation'''
```

## See Also

- [anti-over-gstring](anti-over-gstring.md) - Don't use GString when String will do
- [perf-string-builder](perf-string-builder.md) - Use StringBuilder over + in loops
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for production
