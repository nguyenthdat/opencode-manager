# gradle-script-vs-plugin

> Move complex build logic to `buildSrc` or standalone plugin

## Why It Matters

Build scripts with complex logic become untestable, hard to refactor, and slow down IDE sync. Moving logic to `buildSrc` (an included build) or standalone plugins enables unit testing, IDE support, reuse across projects, and proper separation of concerns.

## Bad

```groovy
// build.gradle — 500+ lines of imperative logic
ext {
    // 50 lines of helper methods
    def parseChangelog = { File f ->
        // Complex parsing logic...
    }
    def generateVersion = { ->
        // Complex version computation...
    }
}

tasks.register('release') {
    doLast {
        // 100 lines of release logic: git operations, changelog parsing,
        // version bumping, artifact uploading, Slack notifications
    }
}
```

## Good

```groovy
// buildSrc/src/main/groovy/com/example/ReleasePlugin.groovy
class ReleasePlugin implements Plugin<Project> {
    void apply(Project project) {
        def ext = project.extensions.create('release', ReleaseExtension)

        project.tasks.register('release', ReleaseTask) {
            changelogFile.set(ext.changelog)
            versionScheme.set(ext.versionScheme)
        }
    }
}

// buildSrc/src/main/groovy/com/example/ReleaseTask.groovy
abstract class ReleaseTask extends DefaultTask {
    @InputFile abstract RegularFileProperty getChangelogFile()
    @Input abstract Property<String> getVersionScheme()

    @TaskAction
    void release() {
        def changelog = parseChangelog()
        def version = computeVersion()
        createTag(version)
        uploadArtifacts(version)
        notifySlack(version, changelog)
    }
}

// build.gradle (now clean)
plugins {
    id 'com.example.release'
}

release {
    changelog = file('CHANGELOG.md')
    versionScheme = 'semver'
}
```

## See Also

- [gradle-convention-plugins](gradle-convention-plugins.md) - Create convention plugins
- [gradle-avoid-doLast](gradle-avoid-doLast.md) - Prefer task actions over doFirst/doLast
- [proj-script-vs-library](proj-script-vs-library.md) - Distinguish scripts from libraries
