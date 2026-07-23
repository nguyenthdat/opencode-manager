# name-script-vs-class

> Script files lowercase, class files `PascalCase`

## Why It Matters

Groovy scripts (executable `.groovy` files without a class wrapper) use lowercase with hyphens or underscores. Class files follow Java convention of `PascalCase.groovy`. This distinction makes the file's purpose immediately clear and follows Gradle's file naming conventions.

## Bad

```
src/main/groovy/
├── UserService.groovy        # Correct
├── userService.groovy        # Wrong — class in camelCase file
├── deployToProd.groovy       # Script — should be lowercase with hyphens
├── RunMigration.groovy       # Script — PascalCase looks like a class
└── build.gradle              # Correct (Gradle convention)
```

## Good

```
src/main/groovy/com/example/
├── UserService.groovy        # Class file
├── OrderProcessor.groovy     # Class file
└── EmailSender.groovy        # Class file

scripts/
├── deploy-to-prod.groovy     # Script
├── run-migration.groovy      # Script
├── seed-database.groovy      # Script
└── build.gradle              # Build script

Jenkinsfile                   # Jenkins convention (no extension)
```

## See Also

- [name-classes-PascalCase](name-classes-PascalCase.md) - Use PascalCase for classes
- [proj-script-vs-library](proj-script-vs-library.md) - Distinguish scripts from libraries
- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
