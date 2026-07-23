# gradle-multi-project

> Use `subprojects` / `allprojects` convention

## Why It Matters

Multi-project Gradle builds benefit from centralized configuration via `subprojects` and `allprojects` blocks, or better yet, convention plugins. This eliminates duplicated plugin applications, repository declarations, and common configuration across subprojects.

## Bad

```groovy
// settings.gradle
include 'core', 'web', 'cli'

// core/build.gradle
plugins { id 'groovy' }
repositories { mavenCentral() }
group = 'com.example'

// web/build.gradle
plugins { id 'groovy' }
repositories { mavenCentral() }
group = 'com.example'

// cli/build.gradle
plugins { id 'groovy' }
repositories { mavenCentral() }
group = 'com.example'
```

## Good

```groovy
// build.gradle (root)
plugins {
    id 'groovy' apply false   // Declared but not applied at root
}

allprojects {
    group = 'com.example'
    version = '1.0.0'
}

subprojects {
    apply plugin: 'groovy'

    repositories {
        mavenCentral()
    }

    tasks.withType(GroovyCompile).configureEach {
        groovyOptions.forkOptions.memoryMaximumSize = '512m'
    }
}

// core/build.gradle — minimal, only project-specific config
dependencies {
    implementation project(':common')
}

// web/build.gradle
dependencies {
    implementation project(':core')
    implementation 'org.springframework.boot:spring-boot-starter-web:3.2.0'
}
```

## See Also

- [gradle-convention-plugins](gradle-convention-plugins.md) - Create convention plugins
- [gradle-script-vs-plugin](gradle-script-vs-plugin.md) - Move complex logic to plugins
- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
