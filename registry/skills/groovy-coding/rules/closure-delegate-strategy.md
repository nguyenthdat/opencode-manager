# closure-delegate-strategy

> Set delegate strategy for DSL closures

## Why It Matters

Closure delegate strategy controls which object resolves method calls inside a closure. For DSL builders, the default `OWNER_FIRST` strategy can lead to unexpected behavior when the owning context has conflicting method names. Setting the correct strategy makes DSL behavior predictable.

## Bad

```groovy
class EmailBuilder {
    def to(String address) { println "To: $address" }
    def subject(String text) { println "Subject: $text" }

    static void build(@DelegatesTo(EmailBuilder) Closure cl) {
        def builder = new EmailBuilder()
        cl.delegate = builder
        cl.resolveStrategy = Closure.OWNER_FIRST  // Default, unpredictable
        cl()
    }
}

// If enclosing scope has a matching method, it takes precedence
def to(String s) { println "Wrong to: $s" }

EmailBuilder.build {
    to 'alice@example.com'     // May resolve to enclosing scope
    subject 'Hello'
}
```

## Good

```groovy
class EmailBuilder {
    def to(String address) { println "To: $address" }
    def subject(String text) { println "Subject: $text" }

    static void build(@DelegatesTo(EmailBuilder) Closure cl) {
        def builder = new EmailBuilder()
        cl.delegate = builder
        cl.resolveStrategy = Closure.DELEGATE_FIRST
        cl()
    }
}

EmailBuilder.build {
    to 'alice@example.com'     // Always resolves to EmailBuilder
    subject 'Hello'
}
```

## Strategies Comparison

```groovy
// DELEGATE_FIRST — DSL builders (most common)
cl.resolveStrategy = Closure.DELEGATE_FIRST

// DELEGATE_ONLY — strict DSL control
cl.resolveStrategy = Closure.DELEGATE_ONLY

// OWNER_FIRST — default, class-like behavior
cl.resolveStrategy = Closure.OWNER_FIRST

// OWNER_ONLY — ignore delegate entirely
cl.resolveStrategy = Closure.OWNER_ONLY

// TO_SELF — closures inside closures
cl.resolveStrategy = Closure.TO_SELF
```

## See Also

- [dsl-closure-delegate](dsl-closure-delegate.md) - Set proper delegate in builder closures
- [closure-owner-this](closure-owner-this.md) - Understand owner vs this vs delegate
- [dsl-method-missing](dsl-method-missing.md) - Use methodMissing for dynamic DSL
