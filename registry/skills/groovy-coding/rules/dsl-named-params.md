# dsl-named-params

> Use named parameters in constructors over telescoping

## Why It Matters

Named constructor parameters (map-based construction) make Groovy object creation self-documenting, eliminate positional argument mistakes, and support optional parameters without constructor overloads. This is foundational to Groovy's DSL-friendly design.

## Bad

```groovy
class Server {
    String host
    int port
    int timeout
    boolean ssl

    Server(String host, int port, int timeout, boolean ssl) {
        this.host = host
        this.port = port
        this.timeout = timeout
        this.ssl = ssl
    }
}

// Positional — error-prone, unclear at call site
def server = new Server('localhost', 8080, 30, true)

// Telescoping constructors
Server(String host, int port) { this(host, port, 30, false) }
Server(String host, int port, int timeout) { this(host, port, timeout, false) }
```

## Good

```groovy
class Server {
    String host
    int port
    int timeout = 30    // Sensible defaults
    boolean ssl = false
}

def server = new Server(
    host: 'localhost',
    port: 8080,
    ssl: true,
    timeout: 60
)

// Only required params, others use defaults
def basic = new Server(host: 'localhost', port: 3000)

// @Canonical combines @ToString, @EqualsAndHashCode, @TupleConstructor
@groovy.transform.Canonical
class Endpoint {
    String path
    String method = 'GET'
}

def ep = new Endpoint('/api/users')
def ep2 = new Endpoint('/api/users', 'POST')
```

## With @Builder

```groovy
@groovy.transform.builder.Builder
class DatabaseConfig {
    String url
    String username
    String password
    int poolSize = 10
    int timeout = 30
}

def config = DatabaseConfig.builder()
    .url('jdbc:postgresql://localhost/mydb')
    .username('admin')
    .password('secret')
    .poolSize(20)
    .build()
```

## See Also

- [dsl-command-chains](dsl-command-chains.md) - Design method chains like DSL
- [closure-tap-with](closure-tap-with.md) - Use tap and with for object configuration
- [name-def-over-type](name-def-over-type.md) - Prefer def for local variables
