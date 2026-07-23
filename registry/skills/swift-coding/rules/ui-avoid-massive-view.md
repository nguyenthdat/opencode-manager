# ui-avoid-massive-view

> Avoid Massive View/View Controller by extracting view models

## Why It Matters

A view (or `UIViewController`) that accumulates networking, validation, formatting, navigation, and layout code all in one type becomes the SwiftUI/UIKit equivalent of a God object: every change risks breaking unrelated functionality, the type is nearly impossible to unit test because its logic is entangled with UI lifecycle methods, and no single contributor can hold the whole thing in their head. Extracting a dedicated view model (or several focused collaborators) gives each concern its own testable, independently reviewable type.

## Bad

```swift
final class DashboardViewController: UIViewController {
    var widgets: [Widget] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        URLSession.shared.dataTask(with: dashboardURL) { data, _, _ in
            guard let data, let decoded = try? JSONDecoder().decode([Widget].self, from: data) else { return }
            DispatchQueue.main.async {
                self.widgets = decoded.sorted { $0.priority > $1.priority }
                self.widgets = self.widgets.filter { $0.isEnabled }
                self.tableView.reloadData()
            }
        }.resume()
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let widget = widgets[indexPath.row]
        if widget.requiresAuth && !AuthManager.shared.isLoggedIn {
            presentLoginFlow()
        } else {
            navigateToDetail(widget)
        }
    }
    // ...fetching, sorting, filtering, auth checks, and navigation all in one 800-line file
}
```

## Good

```swift
@MainActor
final class DashboardViewModel {
    private(set) var widgets: [Widget] = []
    private let repository: WidgetRepository
    private let authManager: AuthManaging

    init(repository: WidgetRepository, authManager: AuthManaging) {
        self.repository = repository
        self.authManager = authManager
    }

    func loadWidgets() async throws {
        let fetched = try await repository.fetchWidgets()
        widgets = fetched
            .filter(\.isEnabled)
            .sorted { $0.priority > $1.priority }
    }

    func canOpen(_ widget: Widget) -> Bool {
        !widget.requiresAuth || authManager.isLoggedIn
    }
}

final class DashboardViewController: UIViewController {
    let viewModel: DashboardViewModel

    init(viewModel: DashboardViewModel) {
        self.viewModel = viewModel
        super.init(nibName: nil, bundle: nil)
    }
    required init?(coder: NSCoder) { fatalError("unsupported") }

    override func viewDidLoad() {
        super.viewDidLoad()
        Task { try? await viewModel.loadWidgets(); tableView.reloadData() }
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let widget = viewModel.widgets[indexPath.row]
        viewModel.canOpen(widget) ? navigateToDetail(widget) : presentLoginFlow()
    }
}
```

## See Also

- [`ui-no-business-logic-in-view`](ui-no-business-logic-in-view.md) - the specific rule about where logic belongs
- [`ui-view-small-composable`](ui-view-small-composable.md) - the SwiftUI-side decomposition counterpart
- [`anti-massive-view-controller`](anti-massive-view-controller.md) - anti-pattern reference
- [`test-protocol-mock-injection`](test-protocol-mock-injection.md) - testing the extracted view model with mocked dependencies
