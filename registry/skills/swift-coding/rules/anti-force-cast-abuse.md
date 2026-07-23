# anti-force-cast-abuse

> Don't force-cast (`as!`) instead of safe casting

## Why It Matters

`as!` asserts a value's runtime type with certainty, but that certainty is frequently unjustified — cell dequeuing, bridged `Any`/`AnyObject` from Objective-C, and JSON-derived values all commonly hand back a different concrete type than expected when an assumption quietly breaks (a storyboard cell identifier mismatch, a legacy notification payload shape, a schema change). When the cast fails, the crash happens at the `as!` line with a generic "could not cast" message that gives no context about what business-logic invariant was actually violated.

## Bad

```swift
func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "ItemCell", for: indexPath) as! ItemCell
    // crashes with a generic cast-failure message if the identifier/class mapping ever drifts
    cell.configure(with: items[indexPath.row])
    return cell
}

let response = try! JSONSerialization.jsonObject(with: data) as! [String: Any]
```

## Good

```swift
func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    guard let cell = tableView.dequeueReusableCell(withIdentifier: "ItemCell", for: indexPath) as? ItemCell else {
        assertionFailure("ItemCell not registered for identifier 'ItemCell' — check Storyboard/registration")
        return UITableViewCell()
    }
    cell.configure(with: items[indexPath.row])
    return cell
}

guard
    let jsonObject = try JSONSerialization.jsonObject(with: data) as? [String: Any]
else {
    throw DecodingError.dataCorrupted(.init(codingPath: [], debugDescription: "Expected a JSON object"))
}
```

## When the Cast Is Truly Guaranteed

A force cast is defensible only when the type relationship is enforced elsewhere by construction and a failure would mean a genuine build/configuration bug worth crashing loudly on in development — e.g., casting the result of `NSKeyedUnarchiver` for a type you control end-to-end with unit tests guarding the archive format. Even then, prefer `as? ... else { fatalError(...) }` so the failure carries a diagnostic message instead of a bare cast-failure trap.

## See Also

- [`type-as-safe-cast`](type-as-safe-cast.md) - the positive-form rule this anti-pattern violates
- [`interop-avoid-force-cast-anyobject`](interop-avoid-force-cast-anyobject.md) - the bridged-`Any` specific variant of this problem
- [`anti-force-unwrap-abuse`](anti-force-unwrap-abuse.md) - the force-unwrap sibling anti-pattern
- [`lint-force-unwrap-rule`](lint-force-unwrap-rule.md) - SwiftLint enforcement covering both `!` and `as!`
