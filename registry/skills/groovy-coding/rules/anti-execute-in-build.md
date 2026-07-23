# anti-execute-in-build

> Don't call external processes during Gradle configuration

## Why It Matters

Gradle's configuration phase runs on every invocation — even `gradle tasks`, `gradle help`, or IDE sync. External commands executed during configuration slow down every Gradle operation and may fail on machines without those tools. Always defer external process execution to the execution phase.

## Bad

```groovy
// build.gradle
def gitHash = 'git rev-parse HEAD'.execute().text.trim()    // Runs on every Gradle invocation!
def nodeVersion = 'node --version'.execute().text.trim()    // Runs during IDE import!

version = gitHash

tasks.register('build') {
    doLast {
        // Actually only needed here
    }
}
```

## Good

```groovy
// build.gradle
def gitHashProvider = providers.exec {
    commandLine('git', 'rev-parse', 'HEAD')
}.standardOutput.asText.map { it.trim() }

version = gitHashProvider.get()

// Or compute inside a task
tasks.register('generateInfo') {
    def outputFile = layout.buildDirectory.file('build-info.properties')

    outputs.file(outputFile)

    doLast {
        def gitHash = 'git rev-parse HEAD'.execute().text.trim()
        outputFile.get().asFile.text = "git.hash=$gitHash"
    }
}
```

## See Also

- [gradle-config-avoid](gradle-config-avoid.md) - Avoid configuration-time resolution
- [gradle-provider-api](gradle-provider-api.md) - Use Provider/Property API
- [gradle-task-lazy](gradle-task-lazy.md) - Use tasks.register() for lazy creation
