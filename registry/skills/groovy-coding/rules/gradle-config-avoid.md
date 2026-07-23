# gradle-config-avoid

> Avoid configuration-time resolution; defer to execution

## Why It Matters

Resolving configurations, reading files, or computing values during the configuration phase forces that work to happen on every Gradle invocation — even `gradle tasks` or `gradle help`. This slows down the IDE import and every build command. Use lazy APIs and `Provider` to defer work.

## Bad

```groovy
// Resolves configuration during configuration phase
def classpath = configurations.runtimeClasspath.files  // Eager!
def jarCount = classpath.count { it.name.endsWith('.jar') }

// Reads file during configuration
def versionFile = file('version.txt')
def version = versionFile.text.trim()  // Read on every Gradle invocation

// Computes during configuration
def timestamp = new Date().format('yyyyMMddHHmmss')
```

## Good

```groovy
// Lazy resolution with Provider
def jarCount = configurations.runtimeClasspath.elements.map { files ->
    files.count { it.name.endsWith('.jar') }
}

// Lazy file reading
def version = providers.fileContents(layout.projectDirectory.file('version.txt'))
    .asText.map { it.trim() }

// Lazy timestamp
def timestamp = provider { new Date().format('yyyyMMddHHmmss') }

// Inside task action — evaluated at execution time only
tasks.register('report') {
    doLast {
        def classpath = configurations.runtimeClasspath.files
        println "Classpath has ${classpath.size()} files"
    }
}
```

## See Also

- [gradle-provider-api](gradle-provider-api.md) - Use Provider/Property API
- [gradle-task-lazy](gradle-task-lazy.md) - Use tasks.register() for lazy creation
- [anti-execute-in-build](anti-execute-in-build.md) - Don't call external processes during config
