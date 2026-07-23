# col-immutable-collections

> Use `@Immutable` or `.asImmutable()` when needed

## Why It Matters

Mutable collections shared across threads or passed to untrusted code can be accidentally modified, causing hard-to-debug data corruption. Groovy provides `@Immutable` for classes that should never change and `.asImmutable()` for ad-hoc immutable wrappers.

## Bad

```groovy
class Configuration {
    List<String> allowedHosts
    Map<String, String> settings
}

def config = new Configuration(
    allowedHosts: ['localhost', 'internal.company.com'],
    settings: ['timeout': '30']
)

// Any caller can mutate
config.allowedHosts << 'evil.com'    // No protection!
config.settings.clear()               // No protection!
```

## Good

```groovy
@groovy.transform.Immutable
class Configuration {
    List<String> allowedHosts
    Map<String, String> settings
}

def config = new Configuration(
    allowedHosts: ['localhost', 'internal.company.com'],
    settings: ['timeout': '30']
)

// Compile error or runtime error
config.allowedHosts << 'evil.com'  // Mutating an immutable property

// For ad-hoc immutability
def hosts = ['localhost', 'internal.company.com'].asImmutable()
def settings = ['timeout': '30'].asImmutable()

// Defensive copy when returning internal state
class Service {
    private List<String> hosts = ['localhost']

    List<String> getAllowedHosts() {
        hosts.asImmutable()   // Or: new ArrayList(hosts)
    }
}
```

## @Immutable Details

```groovy
@groovy.transform.Immutable
class Person {
    String name
    int age
    List<String> tags
    // Auto-generates: constructor, equals, hashCode, toString, getters
    // Defensive copies of collection properties
}

def p1 = new Person(name: 'Alice', age: 30, tags: ['admin'])
def p2 = new Person(name: 'Alice', age: 30, tags: ['admin'])

assert p1 == p2          // Value equality
assert p1.hashCode() == p2.hashCode()

// KnownImmutable — for types that are already immutable
@groovy.transform.Immutable(knownImmutableClasses = [java.time.LocalDate])
class Event {
    String name
    LocalDate date    // Marked as known-immutable, no wrapping needed
}
```

## See Also

- [col-spread-dot](col-spread-dot.md) - Use *. for all-element access
- [col-unique-distinct](col-unique-distinct.md) - Use unique for deduplication
- [meta-delegating-metaClass](meta-delegating-metaClass.md) - Prefer @Delegate over manual delegation
