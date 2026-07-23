# doc-dokka-generation

> Generate API docs with Dokka as part of the build

## Why It Matters

KDoc comments that are never rendered into browsable output only benefit someone reading the source directly — Dokka turns them into a searchable HTML (or Markdown) reference site, the same role Javadoc plays for Java, and wiring it into the build means docs are regenerated automatically and can't silently go stale relative to a tagged release.

## Bad

```kotlin
// No Dokka plugin applied — KDoc comments exist but are never published anywhere;
// consumers of a published library have no reference site to browse, only source.
```

## Good

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "2.0.20"
    id("org.jetbrains.dokka") version "1.9.20"
}

tasks.dokkaHtml {
    outputDirectory.set(layout.buildDirectory.dir("dokka"))
    dokkaSourceSets.named("main") {
        includes.from("Module.md")
        sourceLink {
            localDirectory.set(file("src/main/kotlin"))
            remoteUrl.set(uri("https://github.com/example/repo/tree/main/src/main/kotlin").toURL())
            remoteLineSuffix.set("#L")
        }
    }
}
```

```bash
./gradlew dokkaHtml   # generates browsable HTML docs into build/dokka
```

## Multi-Module Aggregation

```kotlin
// root build.gradle.kts
plugins {
    id("org.jetbrains.dokka") version "1.9.20"
}

dependencies {
    dokka(project(":core"))
    dokka(project(":payments"))
    dokka(project(":networking"))
}
```

`dokkaHtmlMultiModule` aggregates every subproject's generated docs into one navigable site with a shared index, which is the right setup for a Gradle multi-module library.

## CI Publishing

```yaml
# .github/workflows/docs.yml
- run: ./gradlew dokkaHtml
- uses: actions/upload-pages-artifact@v3
  with:
    path: build/dokka
```

Publishing Dokka output on every merge to main (e.g. to GitHub Pages) keeps a live reference site in sync with the actual latest API, closing the loop that pure KDoc-in-source can't close on its own.

## See Also

- [`doc-kdoc-public-api`](doc-kdoc-public-api.md) - the KDoc comments Dokka consumes
- [`doc-module-package-docs`](doc-module-package-docs.md) - `Module.md`/`Package.md` rendered as Dokka's landing pages
- [`proj-gradle-multi-module`](proj-gradle-multi-module.md) - the module layout `dokkaHtmlMultiModule` aggregates
