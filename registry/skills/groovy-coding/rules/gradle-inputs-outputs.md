# gradle-inputs-outputs

> Declare task inputs/outputs for up-to-date checks

## Why It Matters

Without explicit input/output declarations, Gradle can't determine if a task's work is already done. Declaring `@Input`, `@InputFile`, `@OutputFile`, etc. enables incremental builds and build caching, dramatically reducing build times for repeated builds.

## Bad

```groovy
tasks.register('minify') {
    doLast {
        def source = file('src/script.js')
        def dest = file('build/script.min.js')
        dest.parentFile.mkdirs()
        dest.text = compress(source.text)
    }
    // No input/output declarations — always runs
}
```

## Good

```groovy
abstract class Minify extends DefaultTask {
    @InputFile
    abstract RegularFileProperty getSourceFile()

    @OutputFile
    abstract RegularFileProperty getOutputFile()

    @Input
    @Optional
    abstract Property<Boolean> getSourceMap()

    @TaskAction
    void minify() {
        def source = sourceFile.get().asFile
        def dest = outputFile.get().asFile
        dest.parentFile.mkdirs()
        dest.text = compress(source.text)
    }
}

tasks.register('minify', Minify) {
    sourceFile.set(layout.projectDirectory.file('src/script.js'))
    outputFile.set(layout.buildDirectory.file('script.min.js'))
    sourceMap.set(true)
}
```

## Common Annotations

```groovy
abstract class ReportTask extends DefaultTask {
    @Input          // Serializable value
    abstract Property<String> getReportTitle()

    @InputFile      // Single file (path+content tracked)
    abstract RegularFileProperty getTemplate()

    @InputFiles     // Multiple files
    abstract ConfigurableFileCollection getDataFiles()

    @OutputFile     // Single output file
    abstract RegularFileProperty getReportFile()

    @OutputDirectory // Output directory
    abstract DirectoryProperty getOutputDir()

    @Input
    @Optional       // Can be unset
    abstract Property<Integer> getMaxRows()

    @Internal       // Not part of up-to-date check
    abstract Property<String> getLogPrefix()
}
```

## See Also

- [gradle-task-lazy](gradle-task-lazy.md) - Use tasks.register() for lazy creation
- [gradle-cache-remote](gradle-cache-remote.md) - Configure build cache
- [gradle-avoid-doLast](gradle-avoid-doLast.md) - Prefer task actions over doFirst/doLast
