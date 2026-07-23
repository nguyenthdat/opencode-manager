# proj-wrapper-commit

> Commit `gradle-wrapper.jar` and `gradle-wrapper.properties`

## Why It Matters

The Gradle Wrapper ensures every developer and CI agent uses the exact same Gradle version without manual installation. The `gradle-wrapper.jar` is a small bootstrap JAR that downloads the correct Gradle distribution. Committing it (not just `.gitignore`-ing it) is the recommended practice.

## Bad

```
# .gitignore — incorrectly ignoring wrapper
gradle/wrapper/gradle-wrapper.jar    # Wrong! This should be committed
gradle/
```

## Good

```
# .gitignore — ignore Gradle cache, keep wrapper
.gradle/                  # Ignore the cache directory
build/
# DO NOT ignore gradle/wrapper/gradle-wrapper.jar

# Commit these files:
# gradle/wrapper/gradle-wrapper.jar
# gradle/wrapper/gradle-wrapper.properties
# gradlew
# gradlew.bat
```

```bash
# Generate/update wrapper
gradle wrapper --gradle-version 8.5

# Verify correct files are tracked
git add gradle/wrapper/gradle-wrapper.jar \
        gradle/wrapper/gradle-wrapper.properties \
        gradlew gradlew.bat
```

## See Also

- [proj-gitignore-gradle](proj-gitignore-gradle.md) - Include .gradle/, build/ in .gitignore
- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
- [gradle-cache-remote](gradle-cache-remote.md) - Configure build cache
