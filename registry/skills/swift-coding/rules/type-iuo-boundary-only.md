# type-iuo-boundary-only

> Restrict implicitly unwrapped optionals to init/outlet boundaries

## Why It Matters

An implicitly unwrapped optional (`T!`) behaves like a force unwrap on every access, so scattering it through business logic reintroduces crash risk while hiding it behind ordinary-looking property access. Its legitimate use is narrow: bridging a two-phase initialization boundary (like `@IBOutlet`s populated after `init` by a nib/storyboard, or dependency-injected properties set immediately after construction) where the value is guaranteed non-nil by the time normal code runs.

## Bad

```swift
final class ReportGenerator {
    var title: String!          // No real reason for this to be optional at all
    var data: [Row]!
    var delegate: ReportDelegate!

    func generate() -> Report {
        // Any of these can crash if not set in the right order
        return Report(title: title, rows: data, delegate: delegate)
    }
}
```

## Good

```swift
final class ReportGenerator {
    let title: String
    let data: [Row]
    weak var delegate: ReportDelegate?

    init(title: String, data: [Row]) {
        self.title = title
        self.data = data
    }

    func generate() -> Report {
        return Report(title: title, rows: data, delegate: delegate)
    }
}

// IUO is appropriate here: UIKit guarantees the outlet is connected
// by the time viewDidLoad runs.
final class ReportViewController: UIViewController {
    @IBOutlet var titleLabel: UILabel!

    override func viewDidLoad() {
        super.viewDidLoad()
        titleLabel.text = "Report"
    }
}
```

## Other Acceptable Boundary Uses

```swift
// Dependency injected right after construction, before any other use
final class ViewModel {
    var apiClient: APIClient!   // Set by the coordinator immediately after init

    func loadData() async throws -> [Item] {
        try await apiClient.fetchItems()
    }
}

// Better alternative when possible: make it a required init parameter
final class BetterViewModel {
    let apiClient: APIClient
    init(apiClient: APIClient) { self.apiClient = apiClient }
}
```

Prefer constructor injection over IUO properties whenever the object graph allows it — IUOs should be a last resort for frameworks that impose two-phase initialization, not a general convenience.

## See Also

- [`type-no-force-unwrap`](type-no-force-unwrap.md) - the general force-unwrap risk IUOs carry
- [`api-protocol-oriented`](api-protocol-oriented.md) - inject dependencies via protocols in init
- [`anti-implicitly-unwrapped-everywhere`](anti-implicitly-unwrapped-everywhere.md) - the anti-pattern of overusing `!` types
