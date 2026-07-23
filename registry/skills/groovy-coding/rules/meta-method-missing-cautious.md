# meta-method-missing-cautious

> Use `methodMissing` sparingly; prefer traits

## Why It Matters

`methodMissing` catches all undefined method calls, making debugging difficult and masking typos. It defeats IDE autocompletion and static analysis. For extending behavior, traits provide compile-time safety, explicit contracts, and IDE support. Reserve `methodMissing` for DSL builders where runtime dynamism is intentional.

## Bad

```groovy
class DynamicProxy {
    def methodMissing(String name, args) {
        // Silently handles ANY call — typos go undetected
        delegate.invokeMethod(name, args)
    }
}

def proxy = new DynamicProxy()
proxy.calculatTotal(100)    // Typo in method name — no error!

class DataObject {
    def methodMissing(String name, args) {
        props[name] = args[0]   // Arbitrary property setter — no validation
    }
}
```

## Good

```groovy
trait Named {
    String name
    String getDisplayName() { name.toUpperCase() }
}

trait Timestamped {
    Date createdAt = new Date()
    Date updatedAt = new Date()

    void touch() { updatedAt = new Date() }
}

class User implements Named, Timestamped {
    String email
}

// methodMissing is appropriate for DSL builders
class HtmlBuilder {
    def methodMissing(String name, args) {
        if (VALID_TAGS.contains(name)) {
            renderTag(name, args)
        } else {
            throw new MissingMethodException(name, this.class, args)
        }
    }
}
```

## See Also

- [dsl-method-missing](dsl-method-missing.md) - Use methodMissing for dynamic DSL
- [meta-mixin-trait](meta-mixin-trait.md) - Use traits over runtime metaprogramming
- [meta-delegating-metaClass](meta-delegating-metaClass.md) - Prefer @Delegate over manual delegation
