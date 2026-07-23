# doc-mark-organize

> Use `// MARK: -` to organize file sections

## Why It Matters

`// MARK: -` comments show up as navigable, visually separated entries in Xcode's jump bar and minimap, turning a long type into a set of labeled sections a reader can jump straight to (properties, initializers, a specific protocol conformance) instead of scrolling and scanning line by line.

## Bad

```swift
final class ProfileViewController: UIViewController {
    var nameLabel: UILabel!
    var avatarImageView: UIImageView!
    private let viewModel: ProfileViewModel
    override func viewDidLoad() { ... }
    init(viewModel: ProfileViewModel) { ... }
    override func viewWillAppear(_ animated: Bool) { ... }
    private func configureLabel() { ... }
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { ... }
    private func loadAvatar() { ... }
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell { ... }
    // No visual structure; jump bar shows one long undifferentiated list.
}
```

## Good

```swift
final class ProfileViewController: UIViewController {

    // MARK: - Properties

    var nameLabel: UILabel!
    var avatarImageView: UIImageView!
    private let viewModel: ProfileViewModel

    // MARK: - Lifecycle

    init(viewModel: ProfileViewModel) { ... }

    override func viewDidLoad() { ... }
    override func viewWillAppear(_ animated: Bool) { ... }

    // MARK: - Private Helpers

    private func configureLabel() { ... }
    private func loadAvatar() { ... }
}

// MARK: - UITableViewDataSource

extension ProfileViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { ... }
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell { ... }
}
```

## MARK Variants

```swift
// MARK: - Section Title      -> jump bar shows a divider line + bold title
// MARK: Section Title        -> jump bar shows a plain (non-divided) title
// TODO: Handle offline mode  -> shown in jump bar with a distinct TODO marker
// FIXME: Race condition here -> shown in jump bar with a distinct FIXME marker
```

## See Also

- [`api-extension-organize`](api-extension-organize.md) - Organizing conformances into extensions
- [`ui-avoid-massive-view`](ui-avoid-massive-view.md) - When MARK sections signal a type is too large
- [`proj-extension-per-file`](proj-extension-per-file.md) - Splitting large files instead of just marking them
