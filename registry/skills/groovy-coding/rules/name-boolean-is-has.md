# name-boolean-is-has

> Prefix booleans with `is` / `has` / `should`

## Why It Matters

Boolean-returning methods and properties with `is`/`has`/`should`/`can` prefixes read naturally in conditionals (`if (user.isActive)`), making the code self-documenting. Without the prefix, boolean methods can be confused with commands or value-returning methods.

## Bad

```groovy
class User {
    boolean active           // Ambiguous — is it a verb?
    boolean admin            // Could be a role property
    boolean deleted          // Past tense — ambiguous intent
}

if (user.active) { /* ... */ }     // Reads like "if user active"

def validate(Payment p) { }       // Returns boolean? Or throws? Unclear
def empty(List items) { }          // Is this "make empty" or "check empty"?
```

## Good

```groovy
class User {
    boolean isActive
    boolean isAdmin
    boolean hasPaid
    boolean canEdit
    boolean shouldNotify
    boolean isDeleted
}

if (user.isActive) { /* ... */ }     // "if user is active" — clear!
if (user.hasPaid) { /* ... */ }      // "if user has paid"
if (user.canEdit) { /* ... */ }      // "if user can edit"

def isValid(Payment p) { }
def isEmpty(List items) { }
```

## Groovy Property Convention

```groovy
class User {
    boolean active      // Field name

    boolean isActive() { active }   // Groovy auto-generates this getter
}

// These are equivalent in Groovy
assert user.active == user.isActive()

// But isActive() is more explicit about boolean intent
```

## See Also

- [name-methods-camelCase](name-methods-camelCase.md) - Use camelCase for methods
- [name-no-get-prefix](name-no-get-prefix.md) - Drop get prefix for getters
- [err-groovy-truth](err-groovy-truth.md) - Understand Groovy truth
