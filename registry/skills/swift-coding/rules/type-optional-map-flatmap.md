# type-optional-map-flatmap

> Use `map`/`flatMap`/`compactMap` to transform optionals

## Why It Matters

`Optional` is a functor: `map` lets you transform the wrapped value only if it's present, without manually unwrapping and rewrapping. `flatMap` does the same but flattens a nested optional result, avoiding `Optional<Optional<T>>`. Using these instead of `if let`/`else nil` boilerplate keeps transformation pipelines declarative and eliminates a whole class of "forgot to rewrap in `Optional`" mistakes.

## Bad

```swift
func parsedURL(from text: String?) -> URL? {
    if let text = text {
        return URL(string: text)
    } else {
        return nil
    }
}

func doubled(_ value: Int?) -> Int? {
    if let value = value {
        return value * 2
    }
    return nil
}
```

## Good

```swift
func parsedURL(from text: String?) -> URL? {
    return text.flatMap { URL(string: $0) }
}

func doubled(_ value: Int?) -> Int? {
    return value.map { $0 * 2 }
}
```

## map vs flatMap vs compactMap

```swift
let text: String? = "42"

// map: transform the wrapped value, result stays wrapped in Optional
let length: Int? = text.map { $0.count }              // Optional(2)

// flatMap: transform to another Optional, flatten the result
let number: Int? = text.flatMap { Int($0) }            // Optional(42)
// Without flatMap this would be Int?? — an optional optional

// compactMap on a collection: drop the nils after transforming
let strings = ["1", "two", "3"]
let numbers = strings.compactMap { Int($0) }           // [1, 3]

// Chaining transforms
let uppercasedLength = text
    .map { $0.uppercased() }
    .map { $0.count }
```

Use `map` when the transform itself can't fail (returns `T`), `flatMap` when the transform itself returns an `Optional`, and `compactMap` on sequences when you want to filter out `nil` results in one step.

## See Also

- [`type-optional-chaining`](type-optional-chaining.md) - simpler read-only chaining
- [`type-nil-coalescing`](type-nil-coalescing.md) - supply a default after transforming
- [`type-optional-pattern-match`](type-optional-pattern-match.md) - pattern matching as an alternative
