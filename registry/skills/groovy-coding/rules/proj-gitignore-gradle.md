# proj-gitignore-gradle

> Include `.gradle/`, `build/` in `.gitignore`

## Why It Matters

The `.gradle/` and `build/` directories contain generated files, caches, and build artifacts that should never be version controlled. Committing them pollutes the repository, causes merge conflicts on generated files, and leaks local environment details. A proper `.gitignore` keeps the repository clean.

## Bad

```
# .gitignore — missing Gradle entries
*.class
*.jar
```

## Good

```gitignore
# .gitignore — comprehensive Gradle ignore
.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar
out/
*.log
*.tmp

# IDE files
.idea/
*.iml
.vscode/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Secrets
*.pem
*.key
*.p12
secrets.properties
gradle.properties   # If it contains secrets
```

## See Also

- [proj-wrapper-commit](proj-wrapper-commit.md) - Commit gradle-wrapper.jar
- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
- [proj-property-files](proj-property-files.md) - Use gradle.properties for build config
