# err-result-async-deferred

> Use `Result<Success, Failure>` for deferred/stored outcomes

## Why It Matters

`throws`/`try` only works at the point of a synchronous call — you can't store a "future failure" in a property or pass it into a completion handler queue. `Result<Success, Failure>` reifies a success-or-failure outcome as an ordinary value you can store, pass around, transform with `map`/`flatMap`, and convert back into a `throws` call with `get()` exactly when you're ready to handle it.

## Bad

```swift
final class ImageLoader {
    // Can't express "this may have failed" without throws, but this
    // property is read long after loading happened — throws doesn't apply.
    var loadedImage: UIImage?
    var loadError: Error?

    func load(from url: URL, completion: @escaping () -> Void) {
        URLSession.shared.dataTask(with: url) { data, _, error in
            if let error = error {
                self.loadError = error
            } else if let data = data {
                self.loadedImage = UIImage(data: data)
            }
            completion()
        }.resume()
    }
}
```

## Good

```swift
final class ImageLoader {
    private(set) var result: Result<UIImage, ImageError>?

    func load(from url: URL, completion: @escaping (Result<UIImage, ImageError>) -> Void) {
        URLSession.shared.dataTask(with: url) { data, _, error in
            let result: Result<UIImage, ImageError>
            if let error = error {
                result = .failure(.network(error))
            } else if let data = data, let image = UIImage(data: data) {
                result = .success(image)
            } else {
                result = .failure(.decoding)
            }
            self.result = result
            completion(result)
        }.resume()
    }
}

enum ImageError: Error {
    case network(Error)
    case decoding
}
```

## Converting Between Result and throws

```swift
// Result -> throws, when you're finally ready to handle the outcome
func requireImage() throws -> UIImage {
    guard let result = imageLoader.result else {
        throw ImageError.decoding
    }
    return try result.get()
}

// throws -> Result, to store a synchronous throwing call's outcome
let result = Result { try parse(rawText) }

// Transform without unwrapping
let resized: Result<UIImage, ImageError> = result.map { resize($0) }
```

Prefer `async`/`await` with plain `throws` for new asynchronous code — `Result` remains valuable for completion-handler APIs you can't yet migrate, and for storing an outcome that outlives the call that produced it.

## See Also

- [`err-throws-try-propagate`](err-throws-try-propagate.md) - the throws form Result interoperates with
- [`async-await-over-completion`](async-await-over-completion.md) - migrate completion handlers to async/await
- [`async-continuation-bridge`](async-continuation-bridge.md) - bridge legacy Result-based callbacks into async
