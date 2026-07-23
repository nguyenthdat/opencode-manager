# gradle-cache-remote

> Configure build cache and remote caching

## Why It Matters

Gradle's build cache stores task outputs and reuses them when inputs haven't changed, drastically reducing build times. Remote build caches share outputs across CI and developer machines, so a task compiled once is never compiled again by anyone.

## Bad

```groovy
// No cache configuration — default local only
// build.gradle is silent about caching
```

## Good

```groovy
// settings.gradle
buildCache {
    local {
        enabled = true
        removeUnusedEntriesAfterDays = 30
    }

    remote(HttpBuildCache) {
        url = 'https://build-cache.internal.company.com/cache/'
        credentials {
            username = System.getenv('CACHE_USER') ?: project.findProperty('cacheUser')
            password = System.getenv('CACHE_PASS') ?: project.findProperty('cachePass')
        }
        push = System.getenv('CI') == 'true'  // Only CI pushes to remote
    }
}

// gradle.properties
org.gradle.caching = true
org.gradle.parallel = true
org.gradle.configuration-cache = true
```

## See Also

- [gradle-inputs-outputs](gradle-inputs-outputs.md) - Declare task inputs/outputs
- [gradle-task-lazy](gradle-task-lazy.md) - Use tasks.register() for lazy creation
- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
