# gradle-dependency-catalog

> Use version catalogs (`libs.versions.toml`)

## Why It Matters

Centralizing dependency coordinates in a version catalog file provides a single source of truth for all modules. It prevents version drift between subprojects, enables IDE autocompletion for dependency references, and makes upgrading dependencies as simple as changing one number.

## Bad

```groovy
// build.gradle
dependencies {
    implementation 'org.apache.groovy:groovy:4.0.22'
    implementation 'com.google.guava:guava:33.0.0-jre'
    testImplementation 'org.spockframework:spock-core:2.4-M4-groovy-4.0'

    // Same version repeated in subproject-b/build.gradle
    // With a different version by mistake
}
```

## Good

```toml
# gradle/libs.versions.toml
[versions]
groovy = "4.0.22"
guava = "33.0.0-jre"
spock = "2.4-M4-groovy-4.0"

[libraries]
groovy-core = { module = "org.apache.groovy:groovy", version.ref = "groovy" }
guava = { module = "com.google.guava:guava", version.ref = "guava" }
spock-core = { module = "org.spockframework:spock-core", version.ref = "spock" }
spock-junit4 = { module = "org.spockframework:spock-junit4", version.ref = "spock" }

[bundles]
spock = ["spock-core", "spock-junit4"]
```

```groovy
// build.gradle
dependencies {
    implementation libs.groovy.core
    implementation libs.guava
    testImplementation libs.bundles.spock
}
```

## See Also

- [gradle-multi-project](gradle-multi-project.md) - Use subprojects convention
- [gradle-convention-plugins](gradle-convention-plugins.md) - Create convention plugins
- [proj-version-semver](proj-version-semver.md) - Use semantic versioning
