# closure-tap-with

> Use `.tap{}` and `.with{}` for object configuration

## Why It Matters

`.tap{}` and `.with{}` provide fluent, expressive ways to configure new or existing objects. `.tap{}` returns the object itself (for side-effect configuration), while `.with{}` returns the closure result (for transformations). Both eliminate repetitive variable references in configuration blocks.

## Bad

```groovy
def user = new User()
user.name = 'Alice'
user.email = 'alice@example.com'
user.role = 'admin'
user.active = true
save(user)

def builder = new StringBuilder()
builder.append('Hello')
builder.append(' ')
builder.append('World')
def result = builder.toString()
```

## Good

```groovy
def user = new User().tap {
    name = 'Alice'
    email = 'alice@example.com'
    role = 'admin'
    active = true
}

def result = new StringBuilder().with {
    append('Hello')
    append(' ')
    append('World')
    toString()
}

// tap{} returns the receiver — use for config/setup
def config = new ConfigObject().tap {
    server.port = 8080
    server.host = '0.0.0.0'
    database.url = 'jdbc:postgresql://localhost/db'
}

// with{} returns closure result — use for transformations
def fullName = person.with {
    "$firstName $lastName".toUpperCase()
}

assert fullName == 'ALICE SMITH'
```

## Comparison

```groovy
// .tap{} — always returns the delegate object
def user = new User().tap {
    name = 'Alice'
}
assert user instanceof User

// .with{} — returns the closure's last expression
def greeting = new User(name: 'Alice').with {
    "Hello, $name"
}
assert greeting == 'Hello, Alice'

// Both set delegate to the object
def result = [1, 2, 3].tap {
    add(4)        // Method calls resolve to list
}.with {
    sum()         // .with returns the sum
}
assert result == 10
```

## See Also

- [closure-delegate-strategy](closure-delegate-strategy.md) - Set delegate strategy for DSL closures
- [dsl-named-params](dsl-named-params.md) - Use named parameters in constructors
- [dsl-command-chains](dsl-command-chains.md) - Design method chains that read like DSL
