# dsl-method-missing

> Use `methodMissing` / `propertyMissing` for dynamic DSL

## Why It Matters

`methodMissing` and `propertyMissing` allow objects to respond to arbitrary method calls and property accesses at runtime, forming the backbone of Groovy DSLs like Gradle, Jenkins, and markup builders. Used correctly, they create fluent, natural-feeling APIs.

## Bad

```groovy
// Trying to pre-define every possible method
class HtmlBuilder {
    def html(Closure c) { /* ... */ }
    def head(Closure c) { /* ... */ }
    def body(Closure c) { /* ... */ }
    def div(Closure c) { /* ... */ }
    def span(Closure c) { /* ... */ }
    def p(Closure c) { /* ... */ }
    def h1(Closure c) { /* ... */ }
    def h2(Closure c) { /* ... */ }
    // ... infinite number of HTML tags
}
```

## Good

```groovy
class HtmlBuilder {
    def writer = new StringWriter()
    def markup = new groovy.xml.MarkupBuilder(writer)

    def methodMissing(String name, args) {
        if (args && args[-1] instanceof Closure) {
            def attrs = args.size() > 1 ? args[0] : [:]
            markup."$name"(attrs, args[-1])
        } else {
            markup."$name"(*args)
        }
    }
}

def builder = new HtmlBuilder()
builder.html {
    head {
        title 'My Page'
    }
    body {
        h1 'Welcome'
        div(class: 'content') {
            p 'Hello World'
        }
    }
}
```

## Proper Handling

```groovy
class Router {
    private Map<String, Closure> routes = [:]

    def methodMissing(String name, args) {
        if (name.startsWith('on')) {
            def path = name.substring(2).uncapitalize()
            routes[path] = args[0]
        } else {
            throw new MissingMethodException(name, this.class, args)
        }
    }

    def propertyMissing(String name) {
        if (routes.containsKey(name)) {
            return routes[name]
        }
        throw new MissingPropertyException(name, this.class)
    }
}
```

## See Also

- [dsl-closure-delegate](dsl-closure-delegate.md) - Set proper delegate in builder closures
- [meta-method-missing-cautious](meta-method-missing-cautious.md) - Use methodMissing sparingly
- [dsl-command-chains](dsl-command-chains.md) - Design method chains like DSL
