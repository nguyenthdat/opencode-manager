# name-no-get-prefix

> Drop `get` prefix for simple getters (property access)

## Why It Matters

Groovy automatically maps property access to getter calls, so `obj.name` calls `obj.getName()` behind the scenes. Explicit `get` prefixes in method names are redundant Java baggage. Property-style access is the Groovy way and reads more naturally.

## Bad

```groovy
class Person {
    private String name
    String getName() { name }          // Java-style — unnecessary in Groovy
    void setName(String n) { name = n }
}

def person = new Person(name: 'Alice')
println person.getName()               // Java style
println person.getName().toUpperCase() // Verbose
```

## Good

```groovy
class Person {
    String name     // Groovy auto-generates getName/setName
}

def person = new Person(name: 'Alice')
println person.name             // Property access — idiomatic
println person.name.toUpperCase()

// If you need logic in the getter, use explicit property
class Person {
    String firstName
    String lastName

    String getFullName() {      // Computed property, get prefix is fine
        "$firstName $lastName"
    }
}
println person.fullName         // Property access to computed value
```

## See Also

- [dsl-no-getter-calls](dsl-no-getter-calls.md) - Don't call getXxx directly in DSL
- [name-methods-camelCase](name-methods-camelCase.md) - Use camelCase for methods
- [name-boolean-is-has](name-boolean-is-has.md) - Prefix booleans with is/has
