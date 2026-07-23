# api-argument-labels-clarity

> Design argument labels for call-site clarity

## Why It Matters

Swift's argument labels exist specifically so a call site reads like a sentence, disambiguating parameters that would otherwise be an unlabeled, order-dependent guess. Omitting or mis-designing labels forces callers (and reviewers) to go check the function signature to understand what each positional argument means, and increases the chance of accidentally swapping two same-typed arguments without the compiler catching it.

## Bad

```swift
func schedule(_ date: Date, _ repeats: Bool, _ interval: TimeInterval) { }

// Call site reads like a tuple of unlabeled values — meaning is opaque:
schedule(Date(), true, 3600)
```

## Good

```swift
func schedule(at date: Date, repeating: Bool, every interval: TimeInterval) { }

// Call site reads as a sentence:
schedule(at: Date(), repeating: true, every: 3600)
```

## Balancing Labels With Redundancy

Not every parameter needs (or should have) a label — an unlabeled first argument is idiomatic when the function name already makes its role obvious, and over-labeling produces stuttering:

```swift
// Over-labeled: the function name already says "add", labeling the value again is redundant.
func add(value item: Item, to list: List) { }
add(value: apple, to: cart)

// Idiomatic: first argument's role is implied by the function name.
func add(_ item: Item, to list: List) { }
add(apple, to: cart)
```

Use the Swift API Design Guidelines' test: read the call site aloud. `remove(at: index)`, `insert(item, at: index)`, and `subscript(row:column:)` all read naturally; `remove(withIndex: index)` or `insert(theItem: item, position: index)` do not.

## See Also

- [`api-default-parameter-values`](api-default-parameter-values.md) - reducing the number of overloads callers need to memorize
- [`name-preposition-role`](name-preposition-role.md) - using prepositions specifically to clarify parameter role
- [`name-clarity-call-site`](name-clarity-call-site.md) - the general call-site clarity principle this specializes
