# dsl-no-getter-calls

> Don't call `getXxx()` directly in DSL context

## Why It Matters

Groovy's property access syntax (`obj.name`) is the idiomatic way to access properties, not explicit getter calls (`obj.getName()`). In DSL contexts, method calls resolve differently depending on delegate strategy, and explicit getter calls defeat the property-based DSL design. Use property syntax for clean, consistent DSL code.

## Bad

```groovy
def buildEmail(Closure cl) {
    def builder = new EmailBuilder()
    cl.delegate = builder
    cl.resolveStrategy = Closure.DELEGATE_FIRST
    cl()
}

class EmailBuilder {
    String getFrom() { from }
    String getSubject() { subject }
}

buildEmail {
    setFrom('noreply@example.com')    // Java-style setter
    setSubject('Hello')               // Doesn't read like DSL

    println getFrom()                 // Explicit getter — ugly
    println getSubject()
}

// In Gradle scripts
task.setGroup('build')                // Anti-pattern
project.getTasks().getByName('test')
```

## Good

```groovy
buildEmail {
    from 'noreply@example.com'        // DSL-friendly property assignment
    subject 'Hello'

    println from                      // Property access
    println subject
}

// In Gradle scripts
task.group = 'build'
tasks.named('test')

// Use property syntax universally
configurations.runtimeClasspath          // Not: getConfigurations().getByName('runtimeClasspath')
sourceSets.main.java.srcDirs             // Not: getSourceSets().getByName('main').getJava().getSrcDirs()
```

## See Also

- [name-no-get-prefix](name-no-get-prefix.md) - Drop get prefix for simple getters
- [dsl-command-chains](dsl-command-chains.md) - Design method chains like DSL
- [gradle-script-vs-plugin](gradle-script-vs-plugin.md) - Move complex build logic to plugins
