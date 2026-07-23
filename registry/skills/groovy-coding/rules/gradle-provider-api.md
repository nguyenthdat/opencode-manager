# gradle-provider-api

> Use `Provider` / `Property` API for lazy evaluation

## Why It Matters

Gradle's `Provider` and `Property` APIs enable lazy wiring of configuration values, deferring their resolution until execution time. This avoids premature evaluation, respects task ordering, and enables automatic detection of value changes for incremental builds.

## Bad

```groovy
abstract class MyTask extends DefaultTask {
    String outputFile           // Eagerly set during configuration
    int maxRetries              // No change tracking
}

task.dependsOn configurations.compileClasspath  // Eager resolution
task.outputFile = "${buildDir}/output.txt"       // Eager evaluation

// Unnecessary resolution during configuration
def classpath = configurations.runtimeClasspath.files
def jars = classpath.findAll { it.name.endsWith('.jar') }
```

## Good

```groovy
abstract class MyTask extends DefaultTask {
    @OutputFile
    abstract RegularFileProperty getOutputFile()

    @Input
    abstract Property<Integer> getMaxRetries()
}

def task = tasks.register('myTask', MyTask) {
    outputFile.set(layout.buildDirectory.file('output.txt'))
    maxRetries.set(3)
}

// Lazy configuration with Provider
task.dependsOn configurations.compileClasspath

// Use fileCollection and providers
def classpath = configurations.runtimeClasspath
def jarCount = classpath.elements.map { files ->
    files.count { it.name.endsWith('.jar') }
}
```

## Provider Chain

```groovy
def archiveTask = tasks.register('archive', Zip) {
    from(provider {
        // Only evaluated at execution time
        fileTree('src/data').matching { include '**/*.csv' }
    })
}

// Map and flatMap for transforming providers
def outputDir = layout.buildDirectory.dir('reports')
def reportName = provider { "report-${version}.html" }
def reportFile = outputDir.map { it.file(reportName.get()) }
```

## See Also

- [gradle-task-lazy](gradle-task-lazy.md) - Use tasks.register() for lazy creation
- [gradle-config-avoid](gradle-config-avoid.md) - Avoid configuration-time resolution
- [gradle-inputs-outputs](gradle-inputs-outputs.md) - Declare task inputs/outputs
