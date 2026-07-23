---
name: groovy-coding
description: "Comprehensive idiomatic Groovy guidance: 128 prioritized rules across 12 categories. Use when writing, reviewing, refactoring, optimizing, or debugging Groovy (`.groovy`, `build.gradle`, `Jenkinsfile`). Covers closures, GDK collections, DSL design, Gradle, Jenkins pipelines, error handling, metaprogramming, testing, and anti-patterns."
compatibility: opencode
metadata:
  domain: groovy
  audience: software-engineer
  edition: groovy-4
---

# Groovy Best Practices

Comprehensive guide for writing high-quality, idiomatic, and maintainable Groovy code. Contains 128 rules across 12 categories, prioritized by impact to guide LLMs in code generation and refactoring.

## When to Apply

Reference these guidelines when:
- Writing new Groovy classes, scripts, or DSLs
- Implementing Gradle build logic or convention plugins
- Writing Jenkins pipelines (declarative or scripted)
- Designing builder APIs or fluent interfaces
- Processing collections with GDK methods
- Handling errors and null safety in Groovy
- Using metaprogramming or runtime extensions
- Writing Spock tests
- Refactoring existing Groovy code for clarity and performance
- Migrating from Groovy 3 to Groovy 4

## Groovy 4 & Modern Editions

This skill targets **Groovy 4.x** (current stable: 4.0+). Key features to leverage in new and migrated code:

- **Record types.** Groovy 4 supports Java-like `record` types for immutable data carriers with auto-generated `equals`, `hashCode`, `toString`, and component accessors. Use `@RecordType` or `record` keyword.

```groovy
record Point(int x, int y) { }

def p = new Point(3, 4)
assert p.x() == 3
assert "$p" == "Point[x=3, y=4]"
```

- **Sealed types.** Restrict which classes can extend or implement a type using `sealed` keyword, improving exhaustiveness checking in `switch` expressions.

```groovy
sealed interface Shape permits Circle, Rectangle { }
record Circle(double radius) implements Shape { }
record Rectangle(double w, double h) implements Shape { }
```

- **Switch expressions.** Groovy 4 supports expression-style `switch` with exhaustiveness checking for sealed types and enums, returning values directly.

```groovy
def area = switch (shape) {
    case Circle(var r) -> Math.PI * r * r
    case Rectangle(var w, var h) -> w * h
}
```

- **GINQ (Groovy-Integrated Query).** SQL-like querying over collections and data sources with `GQ` syntax, supporting `from`, `on`, `where`, `select`, `orderby`, `groupby`.

```groovy
def result = GQ {
    from p in persons
    where p.age > 18
    orderby p.name
    select p.name, p.age
}
```

- **Type checking (`@TypeChecked` / `@CompileStatic`).** Groovy 4 improves static compilation with better type inference and error reporting. Use `@CompileStatic` for production code to catch errors at compile time and approach Java-level performance.

```groovy
@groovy.transform.CompileStatic
class Calculator {
    int add(int a, int b) { a + b }
}
```

- **Parrot parser.** Groovy 4 ships with the new "Parrot" parser that provides better error messages, faster parsing, and supports new Java syntax. Enabled by default; no configuration needed.

- **JDK compatibility.** Groovy 4 targets JDK 8+ with full support for JDK 21 LTS features. Use `var` (Java 10+), text blocks (Java 15+), and pattern matching where appropriate.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Closures & Functional Programming | CRITICAL | `closure-` | 12 |
| 2 | Error Handling & Null Safety | CRITICAL | `err-` | 11 |
| 3 | GDK & Collection Processing | CRITICAL | `col-` | 14 |
| 4 | DSL & Builder Design | HIGH | `dsl-` | 11 |
| 5 | Gradle Build Scripts | HIGH | `gradle-` | 10 |
| 6 | Jenkins Pipeline (Jenkinsfile) | HIGH | `jenkins-` | 10 |
| 7 | Naming & Style Conventions | MEDIUM | `name-` | 12 |
| 8 | Metaprogramming & Runtime | MEDIUM | `meta-` | 8 |
| 9 | Testing (Spock) | MEDIUM | `test-` | 11 |
| 10 | Performance & Compilation | MEDIUM | `perf-` | 8 |
| 11 | Project Structure & Tooling | LOW | `proj-` | 9 |
| 12 | Anti-patterns | REFERENCE | `anti-` | 12 |

---

## Quick Reference

### 1. Closures & Functional Programming (CRITICAL)

- [`closure-each-over-for`](rules/closure-each-over-for.md) - Prefer `.each{}` / `.collect{}` over explicit `for` loops
- [`closure-implicit-it`](rules/closure-implicit-it.md) - Use implicit `it` sparingly in closures
- [`closure-delegate-strategy`](rules/closure-delegate-strategy.md) - Set delegate strategy for DSL closures
- [`closure-owner-this`](rules/closure-owner-this.md) - Understand `owner` vs `this` vs `delegate` in closures
- [`closure-memoize`](rules/closure-memoize.md) - Use `.memoize()` for expensive closure results
- [`closure-curry-composition`](rules/closure-curry-composition.md) - Use `.curry()` and `.rcurry()` for partial application
- [`closure-trampoline`](rules/closure-trampoline.md) - Use `.trampoline()` for tail-recursive closures
- [`closure-no-side-effects`](rules/closure-no-side-effects.md) - Keep closures side-effect-free when possible
- [`closure-tap-with`](rules/closure-tap-with.md) - Use `.tap{}` and `.with{}` for object configuration
- [`closure-type-check`](rules/closure-type-check.md) - Use `@ClosureParams` for IDE support
- [`closure-no-return`](rules/closure-no-return.md) - Avoid explicit `return` in simple closures
- [`closure-compose-pipe`](rules/closure-compose-pipe.md) - Use `<<` and `>>` for closure composition

### 2. Error Handling & Null Safety (CRITICAL)

- [`err-safe-navigation`](rules/err-safe-navigation.md) - Use `?.` operator over explicit null checks
- [`err-elvis-default`](rules/err-elvis-default.md) - Use `?:` (Elvis) for default values when null
- [`err-no-null-returns`](rules/err-no-null-returns.md) - Return `Optional` or empty collection, not `null`
- [`err-catch-specific`](rules/err-catch-specific.md) - Catch specific exceptions, not `Exception`
- [`err-avoid-checked-to-unchecked`](rules/err-avoid-checked-to-unchecked.md) - Don't silence checked exceptions unnecessarily
- [`err-with-resource`](rules/err-with-resource.md) - Use Groovy's automatic close / try-with-resources
- [`err-assert-for-tests`](rules/err-assert-for-tests.md) - Use `assert` for tests, not production code
- [`err-custom-exception`](rules/err-custom-exception.md) - Create domain-specific exception classes
- [`err-avoid-npe`](rules/err-avoid-npe.md) - Prevent `NullPointerException` with safe navigation
- [`err-groovy-truth`](rules/err-groovy-truth.md) - Understand Groovy truth for null/empty/zero checks
- [`err-no-bare-throw`](rules/err-no-bare-throw.md) - Always throw an exception; don't re-throw without context

### 3. GDK & Collection Processing (CRITICAL)

- [`col-collect-over-map`](rules/col-collect-over-map.md) - Use `.collect{}` over manual list-building loops
- [`col-find-results`](rules/col-find-results.md) - Use `.findAll{}` over filtering loops
- [`col-groupBy-partition`](rules/col-groupBy-partition.md) - Use `.groupBy{}` for grouping, not manual maps
- [`col-spread-dot`](rules/col-spread-dot.md) - Use `*.` (spread-dot) operator for all-element access
- [`col-inject-reduce`](rules/col-inject-reduce.md) - Use `.inject{}` over manual accumulator loops
- [`col-sort-compare`](rules/col-sort-compare.md) - Use `.sort{}` with closures over `Comparable` boilerplate
- [`col-unique-distinct`](rules/col-unique-distinct.md) - Use `.unique()` over manual deduplication
- [`col-any-every`](rules/col-any-every.md) - Use `.any{}` and `.every{}` for boolean checks
- [`col-count-sum`](rules/col-count-sum.md) - Use `.count{}` and `.sum{}` over manual counters
- [`col-grep-filter`](rules/col-grep-filter.md) - Use `.grep()` for type/pattern filtering
- [`col-combinations-permutations`](rules/col-combinations-permutations.md) - Use built-in combinatorics methods
- [`col-flatten-collectMany`](rules/col-flatten-collectMany.md) - Use `.flatten()` or `.collectMany{}` over nested loops
- [`col-immutable-collections`](rules/col-immutable-collections.md) - Use `@Immutable` or `.asImmutable()` when needed
- [`col-ranges-efficiency`](rules/col-ranges-efficiency.md) - Use ranges (`1..10`, `a..<z`) idiomatically

### 4. DSL & Builder Design (HIGH)

- [`dsl-named-params`](rules/dsl-named-params.md) - Use named parameters in constructors over telescoping
- [`dsl-method-missing`](rules/dsl-method-missing.md) - Use `methodMissing` / `propertyMissing` for dynamic DSL
- [`dsl-closure-delegate`](rules/dsl-closure-delegate.md) - Set proper delegate in builder closures
- [`dsl-groovy-markup`](rules/dsl-groovy-markup.md) - Use `MarkupBuilder` / `StreamingMarkupBuilder` for XML/HTML
- [`dsl-json-builder`](rules/dsl-json-builder.md) - Use `JsonBuilder` / `StreamingJsonBuilder` for JSON generation
- [`dsl-config-slurper`](rules/dsl-config-slurper.md) - Use `ConfigSlurper` for hierarchical config files
- [`dsl-command-chains`](rules/dsl-command-chains.md) - Design method chains that read like DSL
- [`dsl-no-getter-calls`](rules/dsl-no-getter-calls.md) - Don't call `getXxx()` directly in DSL context
- [`dsl-extension-modules`](rules/dsl-extension-modules.md) - Use extension modules for type-safe DSL additions
- [`dsl-trait-injection`](rules/dsl-trait-injection.md) - Use traits for reusable DSL behavior
- [`dsl-indent-style`](rules/dsl-indent-style.md) - Maintain consistent DSL indentation for readability

### 5. Gradle Build Scripts (HIGH)

- [`gradle-task-lazy`](rules/gradle-task-lazy.md) - Use `tasks.register()` over `tasks.create()` (lazy configuration)
- [`gradle-provider-api`](rules/gradle-provider-api.md) - Use `Provider` / `Property` API for lazy evaluation
- [`gradle-convention-plugins`](rules/gradle-convention-plugins.md) - Create convention plugins for shared build logic
- [`gradle-avoid-doLast`](rules/gradle-avoid-doLast.md) - Prefer task actions over `doFirst` / `doLast`
- [`gradle-inputs-outputs`](rules/gradle-inputs-outputs.md) - Declare task inputs/outputs for up-to-date checks
- [`gradle-config-avoid`](rules/gradle-config-avoid.md) - Avoid configuration-time resolution; defer to execution
- [`gradle-dependency-catalog`](rules/gradle-dependency-catalog.md) - Use version catalogs (`libs.versions.toml`)
- [`gradle-multi-project`](rules/gradle-multi-project.md) - Use `subprojects` / `allprojects` convention
- [`gradle-cache-remote`](rules/gradle-cache-remote.md) - Configure build cache and remote caching
- [`gradle-script-vs-plugin`](rules/gradle-script-vs-plugin.md) - Move complex build logic to `buildSrc` or standalone plugin

### 6. Jenkins Pipeline / Jenkinsfile (HIGH)

- [`jenkins-declarative-syntax`](rules/jenkins-declarative-syntax.md) - Prefer declarative pipeline over scripted
- [`jenkins-shared-libraries`](rules/jenkins-shared-libraries.md) - Extract reusable steps to shared libraries
- [`jenkins-timeout-retry`](rules/jenkins-timeout-retry.md) - Add `timeout{}` and `retry{}` on flaky steps
- [`jenkins-parallel-stages`](rules/jenkins-parallel-stages.md) - Use `parallel{}` for independent stages
- [`jenkins-when-conditions`](rules/jenkins-when-conditions.md) - Use `when{}` blocks for conditional execution
- [`jenkins-credential-binding`](rules/jenkins-credential-binding.md) - Use `withCredentials()` for secrets
- [`jenkins-agent-label`](rules/jenkins-agent-label.md) - Specify agent labels explicitly; avoid `any`
- [`jenkins-clean-workspace`](rules/jenkins-clean-workspace.md) - Clean workspace before checkout or use `cleanWs()`
- [`jenkins-post-actions`](rules/jenkins-post-actions.md) - Use `post { always/success/failure }` for notifications
- [`jenkins-input-approval`](rules/jenkins-input-approval.md) - Use `input{}` for manual approvals with timeout

### 7. Naming & Style Conventions (MEDIUM)

- [`name-classes-PascalCase`](rules/name-classes-PascalCase.md) - Use `PascalCase` for classes and traits
- [`name-methods-camelCase`](rules/name-methods-camelCase.md) - Use `camelCase` for methods and variables
- [`name-constants-UPPER_SNAKE`](rules/name-constants-UPPER_SNAKE.md) - `UPPER_SNAKE_CASE` for constants (`static final`)
- [`name-boolean-is-has`](rules/name-boolean-is-has.md) - Prefix booleans with `is` / `has` / `should`
- [`name-test-method`](rules/name-test-method.md) - Test methods in Spock: descriptive string labels
- [`name-no-get-prefix`](rules/name-no-get-prefix.md) - Drop `get` prefix for simple getters (property access)
- [`name-closure-params`](rules/name-closure-params.md) - Name closure parameters meaningfully, not `it`
- [`name-package-lowercase`](rules/name-package-lowercase.md) - Lowercase package names with reverse domain
- [`name-script-vs-class`](rules/name-script-vs-class.md) - Script files lowercase, class files `PascalCase`
- [`name-no-underscore-vars`](rules/name-no-underscore-vars.md) - No leading underscores for private (Groovy convention)
- [`name-abbrev-cautious`](rules/name-abbrev-cautious.md) - Spell out abbreviations unless well-known
- [`name-def-over-type`](rules/name-def-over-type.md) - Prefer `def` for local variables unless type is needed

### 8. Metaprogramming & Runtime (MEDIUM)

- [`meta-method-missing-cautious`](rules/meta-method-missing-cautious.md) - Use `methodMissing` sparingly; prefer traits
- [`meta-expando-sparingly`](rules/meta-expando-sparingly.md) - Prefer typed classes over `Expando` when shape is known
- [`meta-category-class`](rules/meta-category-class.md) - Use `@Category` for temporary method injection
- [`meta-mixin-trait`](rules/meta-mixin-trait.md) - Use traits over runtime metaprogramming
- [`meta-delegating-metaClass`](rules/meta-delegating-metaClass.md) - Prefer `@Delegate` over manual delegation
- [`meta-no-global-metaClass`](rules/meta-no-global-metaClass.md) - Don't modify `DefaultGroovyMethods` globally
- [`meta-extension-module`](rules/meta-extension-module.md) - Package runtime extensions as extension modules
- [`meta-compile-static-check`](rules/meta-compile-static-check.md) - Use `@CompileStatic` for production code with meta

### 9. Testing / Spock (MEDIUM)

- [`test-spock-framework`](rules/test-spock-framework.md) - Use Spock for Groovy testing
- [`test-given-when-then`](rules/test-given-when-then.md) - Follow BDD: `given:` / `when:` / `then:` blocks
- [`test-data-tables`](rules/test-data-tables.md) - Use `where:` blocks with data tables for parameterized tests
- [`test-mock-interactions`](rules/test-mock-interactions.md) - Use `Mock` / `Stub` / `Spy` with interaction checking
- [`test-clean-blocks`](rules/test-clean-blocks.md) - Keep `when:` blocks single-action
- [`test-fixture-methods`](rules/test-fixture-methods.md) - Use `setup()` / `cleanup()` / `setupSpec()` / `cleanupSpec()`
- [`test-no-logic-in-then`](rules/test-no-logic-in-then.md) - Don't put complex logic in `then:` blocks
- [`test-shared-state-cautious`](rules/test-shared-state-cautious.md) - Use `@Shared` sparingly; prefer fresh instances
- [`test-exception-conditions`](rules/test-exception-conditions.md) - Use `thrown()` for expected exceptions
- [`test-timeout-condition`](rules/test-timeout-condition.md) - Use timeout conditions with appropriate wait
- [`test-report-dir`](rules/test-report-dir.md) - Configure test reports for CI visibility

### 10. Performance & Compilation (MEDIUM)

- [`perf-compile-static`](rules/perf-compile-static.md) - Use `@CompileStatic` for production code
- [`perf-type-check-annotation`](rules/perf-type-check-annotation.md) - Use `@TypeChecked` for early error detection
- [`perf-primitive-types`](rules/perf-primitive-types.md) - Use primitive types (`int`, `long`) over boxed `Integer`/`Long`
- [`perf-string-builder`](rules/perf-string-builder.md) - Use `StringBuilder` over `+` in loops
- [`perf-no-runtime-meta`](rules/perf-no-runtime-meta.md) - Avoid runtime metaprogramming in hot paths
- [`perf-coll-init-capacity`](rules/perf-coll-init-capacity.md) - Initialize collections with known capacity
- [`perf-lazy-collection`](rules/perf-lazy-collection.md) - Use lazy sequences for large intermediate results
- [`perf-no-string-gstrings`](rules/perf-no-string-gstrings.md) - Use single-quoted strings when interpolation not needed

### 11. Project Structure & Tooling (LOW)

- [`proj-gradle-convention`](rules/proj-gradle-convention.md) - Follow Gradle's standard project layout (`src/main/groovy`)
- [`proj-separate-test-src`](rules/proj-separate-test-src.md) - Keep tests in `src/test/groovy`
- [`proj-script-vs-library`](rules/proj-script-vs-library.md) - Distinguish scripts (executable) from libraries (reusable)
- [`proj-package-by-feature`](rules/proj-package-by-feature.md) - Package by feature, not by type
- [`proj-version-semver`](rules/proj-version-semver.md) - Use semantic versioning in `gradle.properties`
- [`proj-codenarc-lint`](rules/proj-codenarc-lint.md) - Configure CodeNarc for static analysis
- [`proj-gitignore-gradle`](rules/proj-gitignore-gradle.md) - Include `.gradle/`, `build/` in `.gitignore`
- [`proj-wrapper-commit`](rules/proj-wrapper-commit.md) - Commit `gradle-wrapper.jar` and `gradle-wrapper.properties`
- [`proj-property-files`](rules/proj-property-files.md) - Use `gradle.properties` for build configuration

### 12. Anti-patterns (REFERENCE)

- [`anti-runtime-meta-hot`](rules/anti-runtime-meta-hot.md) - Don't use runtime metaprogramming in hot paths
- [`anti-null-propagation`](rules/anti-null-propagation.md) - Don't return `null`; use `Optional` or empty collections
- [`anti-over-gstring`](rules/anti-over-gstring.md) - Don't use `GString` when a plain `String` will do
- [`anti-bare-catch`](rules/anti-bare-catch.md) - Don't catch `Exception` without specific handling
- [`anti-def-everywhere`](rules/anti-def-everywhere.md) - Don't overuse `def`; prefer explicit types for public APIs
- [`anti-no-compile-static`](rules/anti-no-compile-static.md) - Don't skip `@CompileStatic` for production code
- [`anti-global-variables`](rules/anti-global-variables.md) - Don't use global variables in scripts
- [`anti-execute-in-build`](rules/anti-execute-in-build.md) - Don't call external processes during Gradle configuration
- [`anti-nested-closure-hell`](rules/anti-nested-closure-hell.md) - Don't nest closures beyond 3 levels
- [`anti-try-catch-in-each`](rules/anti-try-catch-in-each.md) - Don't use try-catch inside `.each{}`; use `.findResults{}`
- [`anti-raw-groovy-in-jenkins`](rules/anti-raw-groovy-in-jenkins.md) - Don't inline complex Groovy in Jenkins pipelines
- [`anti-no-input-validation`](rules/anti-no-input-validation.md) - Don't trust user input without validation

---

## Recommended Build Configuration

### gradle.properties

```properties
groovyVersion = 4.0.22
spockVersion = 2.4-M4-groovy-4.0
codenarcVersion = 3.4.0
```

### build.gradle

```groovy
plugins {
    id 'groovy'
    id 'codenarc'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation "org.apache.groovy:groovy:${groovyVersion}"
    testImplementation platform("org.spockframework:spock-bom:${spockVersion}")
    testImplementation 'org.spockframework:spock-core'
}

tasks.withType(GroovyCompile).configureEach {
    groovyOptions.configurationScript = file('gradle/config.groovy')
}

codenarc {
    toolVersion = codenarcVersion
    configFile = file('config/codenarc/codenarc.xml')
}
```

### compiler-config.groovy (groovyOptions.configurationScript)

```groovy
withConfig(configuration) {
    ast(groovy.transform.CompileStatic)
    ast(groovy.transform.TypeChecked)
}
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing Groovy code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New Groovy class/script | `closure-`, `err-`, `name-` |
| Collection processing | `col-`, `closure-` |
| DSL / builder design | `dsl-`, `closure-`, `meta-` |
| Gradle build script | `gradle-`, `dsl-` |
| Jenkins pipeline | `jenkins-`, `err-` |
| Error handling | `err-` |
| Testing (Spock) | `test-` |
| Performance tuning | `perf-`, `col-` |
| Code review / audit | `anti-`, `err-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) — GoF and Groovy-specific patterns (builder, delegation, command chains)
- [security-review](../security-review/SKILL.md) — cross-language security/correctness review methodology; its `references/kotlin.md` JVM deserialization/reflection checklist is the closest existing per-language reference until a dedicated Groovy one is added

## Sources

This skill synthesizes best practices from:
- [Apache Groovy Documentation](https://groovy-lang.org/documentation.html)
- [Groovy Style Guide](https://groovy-lang.org/style-guide.html)
- [Gradle User Manual](https://docs.gradle.org/current/userguide/userguide.html)
- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [Spock Framework Documentation](https://spockframework.org/spock/docs/)
- [CodeNarc Rule Reference](https://codenarc.github.io/CodeNarc/)
- Production codebases: Jenkins core, Gradle build tool, Netflix Nebula plugins, JFrog Artifactory
- Community conventions (2024-2025)
