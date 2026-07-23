# gradle-avoid-doLast

> Prefer task actions over `doFirst` / `doLast`

## Why It Matters

`doFirst` and `doLast` add anonymous actions to tasks, obscuring the task's purpose and making behavior hard to trace. They scatter logic across the build file and can't be easily tested or reused. Instead, define a proper task type with a well-named action method.

## Bad

```groovy
tasks.register('processData') {
    doFirst {
        println "Starting data processing"
        def input = file('data.csv')
        if (!input.exists()) {
            throw new GradleException("Missing data.csv")
        }
    }
    doLast {
        def input = file('data.csv')
        def output = file('build/output.json')
        output.parentFile.mkdirs()
        // Processing logic...
        output.text = transform(input.text)
    }
}

tasks.register('deploy') {
    doLast { uploadArtifact() }
    doLast { notifySlack('Deployed!') }  // Second doLast added elsewhere
}
```

## Good

```groovy
abstract class ProcessData extends DefaultTask {
    @InputFile
    abstract RegularFileProperty getInputFile()

    @OutputFile
    abstract RegularFileProperty getOutputFile()

    @TaskAction
    void process() {
        def input = inputFile.get().asFile
        def output = outputFile.get().asFile
        output.parentFile.mkdirs()
        output.text = transform(input.text)
    }
}

tasks.register('processData', ProcessData) {
    inputFile.set(layout.projectDirectory.file('data.csv'))
    outputFile.set(layout.buildDirectory.file('output.json'))
}

// If you must use a script task, keep it to one action
tasks.register('processData') {
    inputs.file('data.csv')
    outputs.file('build/output.json')

    doLast {
        def input = inputs.files.singleFile
        def output = outputs.files.singleFile
        output.parentFile.mkdirs()
        output.text = transform(input.text)
    }
}
```

## See Also

- [gradle-task-lazy](gradle-task-lazy.md) - Use tasks.register() for lazy creation
- [gradle-inputs-outputs](gradle-inputs-outputs.md) - Declare task inputs/outputs
- [gradle-script-vs-plugin](gradle-script-vs-plugin.md) - Move complex logic to plugins
