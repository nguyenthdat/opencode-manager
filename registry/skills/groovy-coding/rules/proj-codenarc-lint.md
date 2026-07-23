# proj-codenarc-lint

> Configure CodeNarc for static analysis

## Why It Matters

CodeNarc analyzes Groovy code for potential defects, style violations, and anti-patterns. It's the equivalent of Checkstyle/PMD for Groovy and integrates with Gradle. Running CodeNarc in CI catches issues before they reach production and enforces consistent code quality across the team.

## Bad

```groovy
// No static analysis configured — bugs and style issues go undetected
plugins {
    id 'groovy'
}
```

## Good

```groovy
// build.gradle
plugins {
    id 'groovy'
    id 'codenarc'
}

codenarc {
    toolVersion = '3.4.0'
    configFile = rootProject.file('config/codenarc/codenarc.xml')
    maxPriority1Violations = 0    // Fail build on critical violations
    maxPriority2Violations = 5    // Allow few medium violations
    maxPriority3Violations = 10    // Allow some minor violations

    reports {
        xml.required = true
        html.required = true
        text.required = false
    }
}

tasks.named('check') {
    dependsOn 'codenarcMain', 'codenarcTest'
}
```

## See Also

- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
- [proj-wrapper-commit](proj-wrapper-commit.md) - Commit gradle-wrapper.jar
- [gradle-convention-plugins](gradle-convention-plugins.md) - Create convention plugins
