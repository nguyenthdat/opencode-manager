# anti-implicitly-unwrapped-everywhere

> Don't sprinkle implicitly unwrapped optionals broadly

## Why It Matters

An implicitly unwrapped optional (`Foo!`) behaves like a landmine disguised as a normal type: it type-checks everywhere a non-optional `Foo` would, giving no visual or compiler signal at the use site that the value might be `nil`, but crashes exactly like a force unwrap the moment it's accessed while `nil`. IUOs exist to solve a narrow set of real problems — two-phase initialization (`@IBOutlet`), delegate patterns where a property is set immediately after `init` — using them as a general-purpose "I don't want to deal with optionality" shortcut spreads that landmine risk across the whole codebase instead of confining it to the few places it's actually justified.

## Bad

```swift
class ProfileViewModel {
    var user: User!               // set "later," but nothing enforces when
    var apiClient: APIClient!     // same pattern, different reason
    var cachedImage: UIImage!     // set only sometimes — now genuinely ambiguous

    func loadProfile() {
        apiClient.fetch(user.id) { result in     // crashes if either is still nil
            // ...
        }
    }
}
```

## Good

```swift
class ProfileViewModel {
    let user: User                // required at init — no ambiguity, no crash risk
    let apiClient: APIClient
    var cachedImage: UIImage?     // genuinely optional — modeled as a real Optional

    init(user: User, apiClient: APIClient) {
        self.user = user
        self.apiClient = apiClient
    }

    func loadProfile() {
        apiClient.fetch(user.id) { result in
            // ...
        }
    }
}
```

## Where IUOs Are Still the Right Tool

Storyboard/XIB `@IBOutlet` properties are the canonical justified use: the property genuinely cannot be set at `init` time (the view hasn't been instantiated from its nib yet), but is guaranteed non-nil by the time any code that uses it runs, because the view lifecycle enforces the ordering:

```swift
class ProfileViewController: UIViewController {
    @IBOutlet var nameLabel: UILabel!   // set by Interface Builder before viewDidLoad — justified IUO
}
```

Keep this justification narrow and explicit — an IUO on a plain property with no such lifecycle guarantee is exactly the anti-pattern this rule targets.

## See Also

- [`type-iuo-boundary-only`](type-iuo-boundary-only.md) - the positive-form rule restricting IUOs to their justified boundary
- [`anti-force-unwrap-abuse`](anti-force-unwrap-abuse.md) - the underlying crash risk IUOs share with explicit `!`
- [`lint-force-unwrap-rule`](lint-force-unwrap-rule.md) - SwiftLint's `implicitly_unwrapped_optional` rule for catching this
- [`api-immutable-by-default`](api-immutable-by-default.md) - preferring `let` with required `init` parameters over deferred-assignment IUOs
