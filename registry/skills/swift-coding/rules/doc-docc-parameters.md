# doc-docc-parameters

> Document parameters with DocC `- Parameter`/`- Parameters`

## Why It Matters

When a function takes more than one or two parameters, a caller reading Quick Help needs to know what each one means and any constraints on it, not just its type. DocC's `- Parameter name:` (singular parameter) and `- Parameters:` (bulleted list for multiple) render as a structured list in Xcode's Quick Help and generated documentation, which is far more scannable than folding that information into prose.

## Bad

```swift
/// Resizes an image to fit within the given bounds while preserving aspect ratio.
/// Pass the image and the max width and height you want, plus whether to
/// upscale smaller images.
func resized(_ image: UIImage, _ maxWidth: CGFloat, _ maxHeight: CGFloat, _ allowUpscaling: Bool) -> UIImage {
    ...
}
```

## Good

```swift
/// Resizes an image to fit within the given bounds while preserving aspect ratio.
///
/// - Parameters:
///   - image: The source image to resize.
///   - maxWidth: The maximum allowed width, in points.
///   - maxHeight: The maximum allowed height, in points.
///   - allowUpscaling: Whether images smaller than the bounds may be scaled up.
///     Pass `false` to only ever shrink, never enlarge.
/// - Returns: A new image no larger than `maxWidth` by `maxHeight`.
func resized(_ image: UIImage, maxWidth: CGFloat, maxHeight: CGFloat, allowUpscaling: Bool) -> UIImage {
    ...
}
```

## Single Parameter Form

```swift
/// Determines whether the given string is a syntactically valid email address.
///
/// - Parameter email: The string to validate. Leading/trailing whitespace
///   is not trimmed before validation.
/// - Returns: `true` if `email` matches the expected format.
func isValidEmail(_ email: String) -> Bool {
    ...
}

// Use the singular "- Parameter x:" form for exactly one parameter,
// and the plural "- Parameters:" bulleted form for two or more —
// DocC treats them as distinct field kinds.
```

## See Also

- [`doc-triple-slash-summary`](doc-triple-slash-summary.md) - The summary line that precedes parameters
- [`doc-docc-returns`](doc-docc-returns.md) - Documenting the return value
- [`doc-docc-throws`](doc-docc-throws.md) - Documenting thrown errors
