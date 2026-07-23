# gradle-convention-plugins

> Create convention plugins for shared build logic

## Why It Matters

Precompiled script plugins and convention plugins in `buildSrc` eliminate copy-pasted build configuration across subprojects. They enforce consistent conventions, simplify adoption of new patterns, and are compiled with type-checking, catching errors before they propagate.

## Bad

```groovy
// subproject-a/build.gradle
plugins {
    id 'groovy'
    id 'codenarc'
}
dependencies {
    testImplementation 'org.spockframework:spock-core:2.4-M4-groovy-4.0'
}
tasks.withType(GroovyCompile).configureEach {
    groovyOptions.forkOptions.memoryMaximumSize = '1g'
}

// subproject-b/build.gradle — same boilerplate copied
plugins {
    id 'groovy'
    id 'codenarc'
}
dependencies {
    testImplementation 'org.spockframework:spock-core:2.4-M4-groovy-4.0'
}
tasks.withType(GroovyCompile).configureEach {
    groovyOptions.forkOptions.memoryMaximumSize = '1g'
}
```

## Good

```groovy
// buildSrc/src/main/groovy/groovy-library-convention.gradle
plugins {
    id 'groovy'
    id 'codenarc'
}

dependencies {
    testImplementation platform('org.spockframework:spock-bom:2.4-M4-groovy-4.0')
    testImplementation 'org.spockframework:spock-core'
    testImplementation 'org.spockframework:spock-junit4'
}

tasks.withType(GroovyCompile).configureEach {
    groovyOptions.forkOptions.memoryMaximumSize = '1g'
}

codenarc {
    toolVersion = '3.4.0'
    configFile = rootProject.file('config/codenarc/codenarc.xml')
}

// subproject-a/build.gradle
plugins {
    id 'groovy-library-convention'
}

// subproject-b/build.gradle
plugins {
    id 'groovy-library-convention'
}
```

## See Also

- [gradle-script-vs-plugin](gradle-script-vs-plugin.md) - Move complex logic to plugins
- [gradle-multi-project](gradle-multi-project.md) - Use subprojects convention
- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
