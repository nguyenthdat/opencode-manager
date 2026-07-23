# closure-owner-this

> Understand `owner` vs `this` vs `delegate` in closures

## Why It Matters

Groovy closures have three distinct scoping references (`this`, `owner`, `delegate`) that behave differently in nested closures. Misunderstanding these leads to subtle bugs where method calls resolve to the wrong object, especially in DSL contexts with nested builders.

## Bad

```groovy
class Outer {
    def name = 'Outer'

    def outerMethod() {
        def innerClosure = {
            println this.name    // Always Outer
            println owner.name   // Outer (enclosing class)
            println delegate.name // Outer (by default)
        }
        innerClosure()
    }
}

class Confusing {
    def field = 'class'

    def method() {
        def outer = {
            def inner = {
                println owner   // Refers to outer closure, not Confusing!
                println this    // Refers to Confusing
                println delegate // Refers to outer closure
            }
            inner()
        }
        outer()
    }
}
```

## Good

```groovy
class Builder {
    def build(Closure cl) {
        cl.delegate = this
        cl.resolveStrategy = Closure.DELEGATE_FIRST
        cl()
    }
}

class Outer {
    def name = 'Outer'

    def createClosure() {
        def cl = {
            println this.name      // 'Outer' — enclosing class
            println owner.name     // 'Outer' — immediate enclosing class
        }
        // For non-nested closures, owner == this == enclosing class
        cl()
    }
}

// Key rules:
// this  = always the enclosing class (nearest class)
// owner = immediate enclosing closure or class
// delegate = owner by default, but can be changed
```

## Visual Reference

```groovy
class Service {
    def serviceField = 'service'

    def method() {
        def outerCl = {                    // owner=Service, this=Service, delegate=Service
            def nestedCl = {               // owner=outerCl, this=Service, delegate=outerCl
                println owner   // outerCl
                println this    // Service
            }
            nestedCl()
        }
        outerCl()

        outerCl.delegate = new Expando(name: 'expando')
        outerCl.resolveStrategy = Closure.DELEGATE_FIRST
        // Now delegate=expando, owner=Service, this=Service
        outerCl()
    }
}
```

## See Also

- [closure-delegate-strategy](closure-delegate-strategy.md) - Set delegate strategy for DSL
- [dsl-closure-delegate](dsl-closure-delegate.md) - Set proper delegate in builder closures
- [dsl-method-missing](dsl-method-missing.md) - Use methodMissing for dynamic DSL
