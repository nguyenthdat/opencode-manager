# proj-gradle-convention

> Follow Gradle's standard project layout (`src/main/groovy`)

## Why It Matters

Gradle's convention-over-configuration approach expects source code in `src/main/groovy`, tests in `src/test/groovy`, and resources in `src/main/resources`. Deviating from this layout requires extra configuration in `build.gradle` and confuses new developers and tooling.

## Bad

```
my-project/
├── src/
│   ├── com/example/Service.groovy        # Non-standard
│   └── test/com/example/ServiceTest.groovy
├── libs/                                  # Non-standard dependency dir
├── config/                                # Should be src/main/resources
└── scripts/
```

## Good

```
my-project/
├── build.gradle
├── settings.gradle
├── gradle.properties
├── src/
│   ├── main/
│   │   ├── groovy/
│   │   │   └── com/example/
│   │   │       ├── Service.groovy
│   │   │       └── model/Order.groovy
│   │   └── resources/
│   │       ├── application.properties
│   │       └── logback.xml
│   └── test/
│       ├── groovy/
│       │   └── com/example/
│       │       ├── ServiceSpec.groovy
│       │       └── model/OrderSpec.groovy
│       └── resources/
│           └── test-data.json
├── gradle/
│   └── libs.versions.toml
└── gradlew
```

## See Also

- [proj-separate-test-src](proj-separate-test-src.md) - Keep tests in src/test/groovy
- [gradle-convention-plugins](gradle-convention-plugins.md) - Create convention plugins
- [proj-gitignore-gradle](proj-gitignore-gradle.md) - Include .gradle/, build/ in .gitignore
