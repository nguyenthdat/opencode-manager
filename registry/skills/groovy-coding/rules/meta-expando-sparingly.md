# meta-expando-sparingly

> Prefer typed classes over `Expando` when shape is known

## Why It Matters

`Expando` creates ad-hoc objects with dynamic properties, but sacrifices type safety, IDE support, and performance. When the object's structure is known at development time, a proper class (or `@Canonical`, `record`, or `Map`) provides compile-time validation, autocompletion, and better runtime performance.

## Bad

```groovy
def createUser() {
    new Expando(
        name: 'Alice',
        email: 'alice@example.com',
        age: 30,
        active: true
    )
}

def user = createUser()
println user.name        // No IDE autocompletion
println user.emial       // Typo — silently returns null

// Passing Expando around — no type contract
def processUser(Expando user) {
    // What properties does user have? Nobody knows.
    user.name   // Could be anything or nothing
}
```

## Good

```groovy
@groovy.transform.Canonical
class User {
    String name
    String email
    int age
    boolean active = true
}

def user = new User(name: 'Alice', email: 'alice@example.com', age: 30)
println user.name     // IDE autocompletion
// user.emial would be a compile error with @TypeChecked

def processUser(User user) {
    user.name   // Type-safe — compiler verifies User has this property
}

// Or use a Map if truly dynamic but bounded
def configProps = [
    host: 'localhost',
    port: 8080,
    timeout: 30
] as ConfigObject
```

## When Expando Is OK

```groovy
// Test stubs — quick mock objects
def mockService = new Expando()
mockService.findUser = { id -> [id: id, name: 'Test'] }
mockService.deleteUser = { id -> true }

// One-off data transfer where shape varies
def dynamicResponse = new Expando()
dynamicResponse.status = 'ok'
dynamicResponse.payload = [data: 'varying-structure']

// Prototyping before finalizing a class
```

## See Also

- [meta-mixin-trait](meta-mixin-trait.md) - Use traits over runtime metaprogramming
- [dsl-named-params](dsl-named-params.md) - Use named parameters in constructors
- [name-def-over-type](name-def-over-type.md) - Prefer def for local variables
