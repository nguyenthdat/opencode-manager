# proj-version-semver

> Use semantic versioning in `gradle.properties`

## Why It Matters

Semantic versioning (`MAJOR.MINOR.PATCH`) communicates the nature of changes to consumers: major = breaking changes, minor = new features (backward-compatible), patch = bug fixes. Declaring the version in `gradle.properties` makes it a single source of truth accessible to both build logic and runtime code.

## Bad

```groovy
// build.gradle — version hardcoded in build script
version = '1.0'
group = 'com.example'

// Inconsistent across modules
// module-a/build.gradle: version = '2.0'
// module-b/build.gradle: version = '1.5.3'
```

## Good

```properties
# gradle.properties
group = com.example
version = 2.3.1
projectName = my-application
```

```groovy
// build.gradle — reads from gradle.properties automatically
println "Building ${group}:${name}:${version}"

// Runtime access to version
@groovy.transform.CompileStatic
class AppInfo {
    static String getVersion() {
        AppInfo.class.package.implementationVersion ?: 'dev'
    }

    // Or read from manifest
    static String getVersionFromJar() {
        def props = new Properties()
        def stream = AppInfo.class.getResourceAsStream('/META-INF/MANIFEST.MF')
        // Parse Implementation-Version
    }
}
```

## See Also

- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
- [proj-property-files](proj-property-files.md) - Use gradle.properties for build config
- [gradle-convention-plugins](gradle-convention-plugins.md) - Create convention plugins
