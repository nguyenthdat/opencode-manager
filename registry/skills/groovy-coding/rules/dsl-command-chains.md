# dsl-command-chains

> Design method chains that read like DSL

## Why It Matters

Command chains transform sequential method calls into natural-language-like expressions. By returning `this` from void-appearing methods and using closures for nesting, you create APIs that read like declarative specifications rather than imperative code.

## Bad

```groovy
class HttpClient {
    HttpClient setBaseUrl(String url) { /* ... */; this }
    HttpClient setAuth(String token) { /* ... */; this }
    HttpClient setTimeout(int seconds) { /* ... */; this }
    Response execute(Request req) { /* ... */ }
}

def client = new HttpClient()
client.setBaseUrl('https://api.example.com')
client.setAuth('bearer-token')
client.setTimeout(30)
def resp = client.execute(new Request(path: '/users'))

// Verbose Java-style setter calls
```

## Good

```groovy
class HttpClient {
    def baseUrl(String url) { /* ... */; this }
    def auth(String token) { /* ... */; this }
    def timeout(int seconds) { /* ... */; this }
    def retries(int count) { /* ... */; this }

    Response get(String path, Closure c = null) {
        def req = new Request(method: 'GET', path: path)
        if (c) {
            c.delegate = req
            c.resolveStrategy = Closure.DELEGATE_FIRST
            c()
        }
        execute(req)
    }
}

def client = new HttpClient()
    .baseUrl('https://api.example.com')
    .auth('bearer-token')
    .timeout(30)
    .retries(3)

def resp = client.get('/users') {
    queryParam('page', 1)
    queryParam('limit', 50)
    header('Accept', 'application/json')
}
```

## Chain Design Principles

```groovy
class Pipeline {
    List<Closure> stages = []

    // Fluent setters — void-like but return this
    def from(String source) { stages << { data -> data << source }; this }
    def select(String... fields) { stages << { data -> data.collect { it.subMap(fields) } }; this }
    def where(Closure predicate) { stages << { data -> data.findAll(predicate) }; this }

    // Terminal operation
    def execute() {
        def data = []
        stages.each { it(data) }
        data
    }
}

def result = new Pipeline()
    .from('users')
    .select('name', 'email')
    .where { it.name.startsWith('A') }
    .execute()
```

## See Also

- [dsl-named-params](dsl-named-params.md) - Use named parameters in constructors
- [closure-tap-with](closure-tap-with.md) - Use tap and with for object configuration
- [dsl-no-getter-calls](dsl-no-getter-calls.md) - Don't call getXxx directly in DSL context
