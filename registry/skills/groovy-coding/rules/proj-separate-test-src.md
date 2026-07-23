# proj-separate-test-src

> Keep tests in `src/test/groovy`

## Why It Matters

Separating test source from production source is a fundamental Gradle convention that enables proper classpath scoping, prevents test code from shipping in production artifacts, and allows different compilation settings for test code. Mixing them breaks the standard Gradle source set model.

## Bad

```
src/main/groovy/com/example/
├── UserService.groovy
├── UserServiceSpec.groovy      # Test in main source — shipped in jar!
├── OrderProcessor.groovy
└── OrderProcessorTest.groovy   # Will be compiled as production code
```

## Good

```
src/
├── main/groovy/com/example/
│   ├── UserService.groovy
│   └── OrderProcessor.groovy
└── test/groovy/com/example/
    ├── UserServiceSpec.groovy       # Spock test
    ├── OrderProcessorSpec.groovy
    └── support/
        ├── TestDataFactory.groovy   # Test helper
        └── IntegrationSpec.groovy   # Base class for integration tests
```

## Gradle Configuration

```groovy
sourceSets {
    test {
        groovy {
            srcDirs = ['src/test/groovy']
        }
        resources {
            srcDirs = ['src/test/resources']
        }
    }

    // Optional: integration test source set
    integrationTest {
        groovy.srcDir 'src/integrationTest/groovy'
        resources.srcDir 'src/integrationTest/resources'
        compileClasspath += main.output + test.output
        runtimeClasspath += main.output + test.output
    }
}
```

## See Also

- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
- [test-spock-framework](test-spock-framework.md) - Use Spock for Groovy testing
- [gradle-convention-plugins](gradle-convention-plugins.md) - Create convention plugins
