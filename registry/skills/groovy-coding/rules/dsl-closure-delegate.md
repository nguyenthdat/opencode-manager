# dsl-closure-delegate

> Set proper delegate in builder closures

## Why It Matters

DSL builders rely on closure delegation to route method calls to the builder object. Without explicitly setting both `delegate` and `resolveStrategy`, nested closures may resolve methods against the wrong context, causing subtle DSL bugs that are hard to diagnose.

## Bad

```groovy
class ReportBuilder {
    def title(String t) { println "Title: $t" }
    def section(String name, Closure body) { body() }  // Delegate not changed!

    static def report(Closure cl) {
        def builder = new ReportBuilder()
        cl.delegate = builder  // delegate set but no resolveStrategy!
        cl()
    }
}

ReportBuilder.report {
    title 'My Report'
    section 'Intro' {
        // section body runs with outer delegate — no access to section methods
    }
}
```

## Good

```groovy
class ReportBuilder {
    def title(String t) { println "Title: $t" }

    def section(String name,
                @DelegatesTo(SectionBuilder) Closure body) {
        println "\n## $name"
        def sectionBuilder = new SectionBuilder()
        body.delegate = sectionBuilder
        body.resolveStrategy = Closure.DELEGATE_FIRST
        body()
    }

    static def report(
        @DelegatesTo(ReportBuilder) Closure cl) {
        def builder = new ReportBuilder()
        cl.delegate = builder
        cl.resolveStrategy = Closure.DELEGATE_FIRST
        cl()
    }
}

ReportBuilder.report {
    title 'Q4 Analysis'
    section 'Revenue' {
        paragraph 'Revenue grew 15%'
    }
}
```

## Reusable Delegate Setup

```groovy
trait BuilderSupport {
    static <T> T build(Class<T> type,
                       @DelegatesTo.Target Class<T> delegateType,
                       @DelegatesTo Closure cl) {
        def instance = type.newInstance()
        cl.delegate = instance
        cl.resolveStrategy = Closure.DELEGATE_FIRST
        cl()
        instance
    }
}
```

## See Also

- [closure-delegate-strategy](closure-delegate-strategy.md) - Set delegate strategy for DSL closures
- [dsl-method-missing](dsl-method-missing.md) - Use methodMissing for dynamic DSL
- [closure-owner-this](closure-owner-this.md) - Understand owner vs this vs delegate
