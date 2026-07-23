# name-clarity-call-site

> Prioritize clarity at the point of use over brevity

## Why It Matters

Swift APIs are read far more often than they are written, and the call site is where that reading happens. A name that looks fine in isolation can be ambiguous or misleading once it appears with its arguments at the call site. The Swift API Design Guidelines explicitly rank clarity above brevity: a slightly longer, unambiguous call is better than a short, cryptic one.

## Bad

```swift
struct Employee {
    func remove(_ x: Int, _ y: Bool)
}

let employee = Employee()
employee.remove(4, true)
// What is 4? What does true mean? Unreadable at the call site.

extension Array {
    func add(_ e: Element, _ i: Int)
}
numbers.add(5, 0)
```

## Good

```swift
struct Employee {
    func removeVacationDays(_ days: Int, notifyManager: Bool)
}

let employee = Employee()
employee.removeVacationDays(4, notifyManager: true)
// Reads like a sentence: unambiguous at the call site.

extension Array {
    mutating func insert(_ newElement: Element, at index: Int)
}
numbers.insert(5, at: 0)
```

## When Brevity Is Still Fine

```swift
// Well-established, unambiguous shorthand is fine even without
// full words, because context (the type) supplies the meaning.
extension Collection {
    var isEmpty: Bool { count == 0 }
}

// x.isEmpty reads clearly without needing "checkIfCollectionIsEmpty"

// Omit needless words when the type already conveys meaning:
struct Array<Element> {
    mutating func remove(at index: Int) -> Element
}
employees.remove(at: 2) // not removeElement(at:)
```

## See Also

- [`name-preposition-role`](name-preposition-role.md) - Use prepositions to clarify parameter role
- [`name-avoid-abbreviation`](name-avoid-abbreviation.md) - Avoid unclear abbreviations
- [`name-boolean-assertive`](name-boolean-assertive.md) - Name predicates assertively
- [`api-argument-labels-clarity`](api-argument-labels-clarity.md) - Argument label design
