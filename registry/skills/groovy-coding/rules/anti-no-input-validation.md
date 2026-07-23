# anti-no-input-validation

> Don't trust user input without validation

## Why It Matters

Unvalidated input is the root cause of injection attacks (SQL, command, script), data corruption, and unexpected crashes. Groovy's dynamic nature makes it especially vulnerable — an unsanitized string passed to `Eval.me()` or `evaluate()` can execute arbitrary code. Always validate and sanitize at system boundaries.

## Bad

```groovy
def search(String query) {
    def sql = "SELECT * FROM products WHERE name LIKE '%${query}%'"   // SQL injection!
    db.execute(sql)
}

def evaluateExpression(String expr) {
    Eval.me(expr)     // Remote code execution risk!
}

def parseConfig(String yaml) {
    def config = new groovy.json.JsonSlurper().parseText(yaml)   // No size limit
    config
}
```

## Good

```groovy
def search(String query) {
    if (query == null || query.length() > 100) {
        throw new IllegalArgumentException("Query must be 1-100 characters")
    }
    def sql = 'SELECT * FROM products WHERE name LIKE ?'
    db.query(sql, ["%${query}%"])
}

def evaluateExpression(String expr) {
    // NEVER use Eval.me() on user input — use a proper expression parser
    def parser = new ExpressionParser()
    parser.parse(expr).evaluate()
}

def parseConfig(String json) {
    if (json == null || json.length() > 10_000_000) {
        throw new IllegalArgumentException("Config must be under 10MB")
    }
    new groovy.json.JsonSlurper().parseText(json)
}
```

## See Also

- [err-catch-specific](err-catch-specific.md) - Catch specific exceptions
- [err-custom-exception](err-custom-exception.md) - Create domain-specific exceptions
- [err-no-bare-throw](err-no-bare-throw.md) - Always throw with context
