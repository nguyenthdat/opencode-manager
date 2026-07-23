# gradle-task-lazy

> Use `tasks.register()` over `tasks.create()` (lazy configuration)

## Why It Matters

`tasks.create()` eagerly creates and configures the task immediately during the configuration phase, even if the task is never executed. `tasks.register()` (Gradle 4.9+) creates a `TaskProvider` that defers configuration until needed, improving build performance and avoiding unnecessary work during configuration.

## Bad

```groovy
task myTask(type: Copy) {        // Equivalent to tasks.create() — eager
    from 'src/data'
    into 'build/output'
}

tasks.create('process') {        // Explicit eager creation
    doLast {
        println 'done'
    }
}

// Eagerly configured even when task won't run
tasks.create('deploy', Deploy) {
    // Connects to server during configuration phase!
    serverUrl = 'https://prod.example.com'
}
```

## Good

```groovy
tasks.register('myTask', Copy) {
    from 'src/data'
    into 'build/output'
}

// Register with custom type
tasks.register('process') {
    doLast {
        println 'done'
    }
}

// TaskProvider can be referenced before task exists
def deployTask = tasks.register('deploy', Deploy) {
    serverUrl = 'https://prod.example.com'
}

// Referencing by name is also lazy
tasks.named('deploy', Deploy).configure {
    serverUrl = 'https://prod.example.com'
}
```

## TaskProvider Patterns

```groovy
// Chain task registrations
def compile = tasks.register('compile') { /* ... */ }
def test = tasks.register('test') {
    dependsOn compile
    // ...
}

// Conditional configuration
tasks.register('optionalTask') {
    onlyIf { someCondition }
}

// Lazy wiring
tasks.register('archive', Zip) {
    from tasks.named('compile').map { it.outputs.files }
}
```

## See Also

- [gradle-provider-api](gradle-provider-api.md) - Use Provider/Property API
- [gradle-config-avoid](gradle-config-avoid.md) - Avoid configuration-time resolution
- [gradle-avoid-doLast](gradle-avoid-doLast.md) - Prefer task actions over doFirst/doLast
