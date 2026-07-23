# type-as-safe-cast

> Use `as?` safe casting, not `as!` force cast

## Why It Matters

`as!` crashes immediately if the runtime type doesn't match, which is especially dangerous when casting values whose concrete type you don't fully control — `Any`, `AnyObject`, values from Objective-C APIs, deserialized JSON, or cell dequeuing in UIKit. `as?` returns `nil` on mismatch instead of crashing, letting you handle the mismatch as an ordinary optional.

## Bad

```swift
func handleNotification(_ object: Any) {
    let payload = object as! [String: Any]   // Crashes if shape changes
    let userID = payload["user_id"] as! String
    process(userID)
}

func cell(for indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath) as! CustomCell
    return cell
}
```

## Good

```swift
func handleNotification(_ object: Any) {
    guard let payload = object as? [String: Any],
          let userID = payload["user_id"] as? String else {
        log.warning("Unexpected notification payload: \(object)")
        return
    }
    process(userID)
}

func cell(for indexPath: IndexPath) -> UITableViewCell {
    guard let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath) as? CustomCell else {
        assertionFailure("Cell not registered for identifier 'Cell'")
        return UITableViewCell()
    }
    return cell
}
```

## When as! Is Defensible

```swift
// Registered cell types in a table view you control end-to-end are a
// near-guaranteed match, but even then prefer as? + assertionFailure
// so a future refactor that breaks the invariant doesn't crash in production.

// Casting a type you just constructed yourself in the same expression:
let numbers = [1, 2, 3] as [Any] as! [Int]   // Contrived — avoid; write it directly instead

// A more realistic acceptable case: downcasting after a type check
// you performed yourself in the same scope
if object is CustomView {
    let view = object as! CustomView   // Still prefer `as?` + guard here
}
```

In practice, reach for `as!` only in test code or in narrowly scoped, well-commented spots where a mismatch truly represents an unrecoverable bug you want to surface loudly — never for data whose shape crosses a process, network, or plugin boundary.

## See Also

- [`type-no-force-unwrap`](type-no-force-unwrap.md) - the general force-unwrap risk this rule extends to casting
- [`err-do-catch-specific`](err-do-catch-specific.md) - handle specific failure cases explicitly
- [`anti-force-cast-abuse`](anti-force-cast-abuse.md) - the broader anti-pattern this rule guards against
- [`interop-avoid-force-cast-anyobject`](interop-avoid-force-cast-anyobject.md) - same issue at Objective-C interop boundaries
