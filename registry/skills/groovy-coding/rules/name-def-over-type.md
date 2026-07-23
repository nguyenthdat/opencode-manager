# name-def-over-type

> Prefer `def` for local variables unless type is needed

## Why It Matters

`def` is the idiomatic Groovy way to declare local variables, embracing dynamic typing where appropriate. Explicit types should be used for public API method signatures and when the type isn't obvious from the right-hand side. Over-typing local variables adds noise without clarity.

## Bad

```groovy
String name = 'Alice'                          // Type is obvious
Integer count = items.size()                   // Type is obvious
List<User> active = users.findAll { it.active } // Verbose
Map<String, Object> config = loadConfig()       // Over-specified

// When type IS needed
def result = compute()                         // What does compute() return?
def data = service.getData()                   // Vague
```

## Good

```groovy
def name = 'Alice'              // Type is obvious
def count = items.size()        // Type is obvious
def active = users.findAll { it.active }   // Type not critical locally

// Use explicit types when needed
User user = session.currentUser         // Type matters for later usage
JsonSlurper slurper = new JsonSlurper()  // Type matters for method discoverability
Map<String, List<Order>> ordersByCustomer = groupOrders(customers)  // Type IS the documentation

// Public APIs always use explicit types
class UserRepository {
    List<User> findActiveUsers() { /* ... */ }
    User findById(Long id) { /* ... */ }
}
```

## See Also

- [anti-def-everywhere](anti-def-everywhere.md) - Don't overuse def
- [name-methods-camelCase](name-methods-camelCase.md) - Use camelCase for methods
- [perf-compile-static](perf-compile-static.md) - Use CompileStatic for performance
