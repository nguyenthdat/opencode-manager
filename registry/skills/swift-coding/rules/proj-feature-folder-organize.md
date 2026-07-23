# proj-feature-folder-organize

> Organize source by feature, not by type

## Why It Matters

Organizing by type ("all views in `Views/`, all view models in `ViewModels/`, all networking in `Networking/`") forces every change to a single feature to touch three or four unrelated folders, makes it hard to tell what belongs together, and makes deleting a feature a scavenger hunt across the whole tree. Organizing by feature keeps everything a change to "Profile" or "Checkout" touches in one place, so onboarding a new engineer to a feature means opening one folder, and deleting a feature is deleting one folder.

## Bad

```
Sources/
  Views/
    ProfileView.swift
    CheckoutView.swift
    SettingsView.swift
  ViewModels/
    ProfileViewModel.swift
    CheckoutViewModel.swift
    SettingsViewModel.swift
  Models/
    Profile.swift
    Order.swift
    Settings.swift
  Networking/
    ProfileAPI.swift
    CheckoutAPI.swift
```
Adding a field to "Profile" means touching `Views/ProfileView.swift`, `ViewModels/ProfileViewModel.swift`, `Models/Profile.swift`, and `Networking/ProfileAPI.swift` — four folders for one feature.

## Good

```
Sources/
  Profile/
    ProfileView.swift
    ProfileViewModel.swift
    Profile.swift
    ProfileAPI.swift
  Checkout/
    CheckoutView.swift
    CheckoutViewModel.swift
    Order.swift
    CheckoutAPI.swift
  Settings/
    SettingsView.swift
    SettingsViewModel.swift
    Settings.swift
  Shared/
    DesignSystem/
    NetworkingCore/
```
Everything the "Profile" feature owns lives under `Profile/`; only genuinely cross-feature code lives in `Shared/`.

## Combining With SPM Targets

At larger scale, promote feature folders into their own SPM targets so the boundary is compiler-enforced, not just a folder convention:

```swift
targets: [
    .target(name: "Shared"),
    .target(name: "ProfileFeature", dependencies: ["Shared"]),
    .target(name: "CheckoutFeature", dependencies: ["Shared"]),
    .target(name: "SettingsFeature", dependencies: ["Shared"]),
    .target(name: "App", dependencies: ["ProfileFeature", "CheckoutFeature", "SettingsFeature"])
]
```

This prevents `CheckoutFeature` from ever accidentally importing `ProfileFeature` internals, which a folder-only convention cannot stop.

## See Also

- [`proj-spm-module-boundaries`](proj-spm-module-boundaries.md) - promote feature folders to real module boundaries as the app grows
- [`proj-flat-small-package`](proj-flat-small-package.md) - don't split into feature targets prematurely for small apps
- [`proj-extension-per-file`](proj-extension-per-file.md) - the file-level organization principle within a feature folder
