# test-report-dir

> Configure test reports for CI visibility

## Why It Matters

Spock generates JUnit-compatible XML reports that CI systems (Jenkins, GitHub Actions, GitLab CI) can parse and display. Without proper configuration, test results are invisible to CI dashboards, making failures hard to track over time.

## Bad

```groovy
// build.gradle — no test reporting configuration
test {
    useJUnitPlatform()
}
```

## Good

```groovy
// build.gradle
test {
    useJUnitPlatform()

    testLogging {
        events 'passed', 'skipped', 'failed'
        exceptionFormat = 'full'
        showStandardStreams = true
    }

    reports {
        junitXml {
            outputPerTestCase = true
            mergeReruns = true
        }
        html {
            outputLocation = layout.buildDirectory.dir('reports/tests')
        }
    }
}

tasks.register('testReport', TestReport) {
    destinationDirectory = layout.buildDirectory.dir('reports/all-tests')
    testResults.from = subprojects*.test.binaryResultsDirectory
}
```

## See Also

- [test-spock-framework](test-spock-framework.md) - Use Spock for Groovy testing
- [gradle-inputs-outputs](gradle-inputs-outputs.md) - Declare task inputs/outputs
- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
