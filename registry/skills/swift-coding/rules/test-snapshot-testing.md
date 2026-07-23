# test-snapshot-testing

> Use snapshot testing for view/output regression coverage

## Why It Matters

Manually asserting on every pixel, layout constant, or serialized string of a complex view or output format is impractical, and hand-written assertions tend to only check the properties the author thought of. Snapshot testing captures the actual rendered output (an image, a view hierarchy description, or a serialized string) once as a reference, then fails future runs on any unintended diff—catching regressions that targeted unit assertions would miss.

## Bad

```swift
import Testing

struct ProfileCardViewTests {
    @Test
    func rendersExpectedLayout() {
        let view = ProfileCardView(user: .preview)
        // Hand-checking a handful of properties gives false confidence;
        // a spacing or color regression elsewhere goes undetected.
        #expect(view.nameLabel.text == "Ada Lovelace")
        #expect(view.avatarImageView.image != nil)
    }
}
```

## Good

```swift
import Testing
import SnapshotTesting // e.g. pointfreeco/swift-snapshot-testing

struct ProfileCardViewTests {
    @Test
    func rendersExpectedLayout() {
        let view = ProfileCardView(user: .preview)
        view.frame = CGRect(x: 0, y: 0, width: 320, height: 120)

        assertSnapshot(of: view, as: .image)
    }
}
```

## Snapshotting Non-Visual Output

```swift
import Testing
import SnapshotTesting

struct APIResponseEncodingTests {
    @Test
    func encodesOrderAsExpectedJSON() throws {
        let order = Order(id: "42", items: [.init(name: "Book", price: 20)])
        let data = try JSONEncoder.pretty.encode(order)
        let json = String(decoding: data, as: UTF8.self)

        assertSnapshot(of: json, as: .lines)
    }
}

// Recording mode: set isRecording = true temporarily to (re)generate
// reference snapshots after an intentional UI/format change, then
// review the diff in source control before committing it and turning
// isRecording back off.
```

## See Also

- [`test-descriptive-test-names`](test-descriptive-test-names.md) - Naming snapshot test cases
- [`ui-view-small-composable`](ui-view-small-composable.md) - Small views make focused snapshots easier
- [`doc-code-listing-example`](doc-code-listing-example.md) - Documenting expected output formats
