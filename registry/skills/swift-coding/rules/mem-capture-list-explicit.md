# mem-capture-list-explicit

> Use explicit capture lists to document ownership intent

## Why It Matters

A closure without a capture list captures every referenced variable strongly by default, which silently commits to whatever ownership is convenient rather than what's correct. Writing the capture list out — `[weak self]`, `[unowned self]`, `[self]`, or capturing specific properties by value — makes the ownership decision a reviewable, intentional part of the code instead of an implicit side effect of what names happen to appear in the closure body.

## Bad

```swift
final class SearchController {
    var results: [Result] = []
    let searchService: SearchService

    init(searchService: SearchService) {
        self.searchService = searchService
    }

    func search(_ query: String) {
        searchService.fetch(query) { results in
            self.results = results   // implicit strong capture of self — easy to miss in review
        }
    }
}
```

## Good

```swift
final class SearchController {
    var results: [Result] = []
    let searchService: SearchService

    init(searchService: SearchService) {
        self.searchService = searchService
    }

    func search(_ query: String) {
        searchService.fetch(query) { [weak self] results in
            self?.results = results   // ownership intent is explicit and reviewable
        }
    }
}
```

## Capturing Specific Values Instead of `self`

When a closure only needs one or two properties, capture them by value instead of capturing `self` at all — this avoids the retain-cycle question entirely and documents exactly what the closure depends on:

```swift
final class ReportGenerator {
    let reportID: String
    var onComplete: (() -> Void)?

    func generate() {
        let id = reportID
        exportQueue.async { [id] in
            let report = Report(id: id)   // no `self` capture needed at all
            report.write()
        }
    }
}
```

Prefer `[weak self]` for anything long-lived or escaping, `[unowned self]` only under the guarantees described in `mem-unowned-non-optional`, and value captures whenever the closure doesn't need the full instance.

## See Also

- [`mem-weak-self-closure`](mem-weak-self-closure.md) - when to choose weak over unowned or strong
- [`mem-unowned-non-optional`](mem-unowned-non-optional.md) - the guarantees required for unowned
- [`anti-retain-cycle-closure`](anti-retain-cycle-closure.md) - anti-pattern reference
