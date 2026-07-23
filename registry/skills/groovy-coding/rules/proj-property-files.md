# proj-property-files

> Use `gradle.properties` for build configuration

## Why It Matters

`gradle.properties` is the standard location for project-wide Gradle and JVM settings. It's automatically loaded by Gradle without any `build.gradle` code, keeps configuration out of the build script, and supports per-developer overrides via `~/.gradle/gradle.properties`.

## Bad

```groovy
// build.gradle — hardcoded settings
allprojects {
    group = 'com.example'
    version = '1.0.0'
}

// build.gradle — hardcoded JVM args
tasks.withType(GroovyCompile).configureEach {
    groovyOptions.forkOptions.jvmArgs = ['-Xmx2g', '-XX:+UseG1GC']
}
```

## Good

```properties
# gradle.properties
group = com.example
version = 2.3.1

# JVM settings
org.gradle.jvmargs = -Xmx2g -XX:+UseG1GC -XX:MaxMetaspaceSize=512m
org.gradle.parallel = true
org.gradle.caching = true
org.gradle.configuration-cache = true

# Kotlin/Java compilation
kotlin.code.style = official

# Custom properties
app.mainClass = com.example.Application
app.description = My Groovy Application
```

## Developer Overrides (~/.gradle/gradle.properties)

```properties
# Per-machine settings — never committed
org.gradle.jvmargs = -Xmx4g -XX:+UseZGC
systemProp.http.proxyHost = proxy.company.com
systemProp.http.proxyPort = 8080
```

## See Also

- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
- [proj-version-semver](proj-version-semver.md) - Use semantic versioning
- [gradle-convention-plugins](gradle-convention-plugins.md) - Create convention plugins
