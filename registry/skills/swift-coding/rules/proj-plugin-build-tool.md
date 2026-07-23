# proj-plugin-build-tool

> Use SPM build tool plugins for codegen instead of manual scripts

## Why It Matters

A codegen step run by hand ("remember to run `./scripts/generate.sh` before building") is easy to forget, produces stale generated code that silently diverges from its source of truth, and isn't reproducible in CI unless someone remembers to wire the script into the pipeline separately. An SPM build tool plugin runs automatically as part of `swift build`/`swift test`/Xcode's build, so generated code is always in sync with its inputs, the dependency graph is explicit (the plugin declares what it reads and writes), and there's no separate manual or CI-only step to fall out of sync.

## Bad

```
Sources/
  APIKit/
    generate-models.sh       # must be run manually before every build
    Models.generated.swift   # checked in, goes stale if generate-models.sh isn't rerun
    openapi.yaml
```
```bash
# README: "Before building, run ./Sources/APIKit/generate-models.sh"
# — easy to forget, and CI must remember to run it too, separately from `swift build`
```

## Good

```swift
// Package.swift
let package = Package(
    name: "APIKit",
    targets: [
        .target(
            name: "APIKit",
            plugins: ["GenerateModelsPlugin"]
        ),
        .plugin(
            name: "GenerateModelsPlugin",
            capability: .buildTool(),
            dependencies: ["ModelGenerator"]
        ),
        .executableTarget(name: "ModelGenerator")
    ]
)
```

```swift
// Plugins/GenerateModelsPlugin/plugin.swift
import PackagePlugin

@main
struct GenerateModelsPlugin: BuildToolPlugin {
    func createBuildCommands(context: PluginContext, target: Target) throws -> [Command] {
        let openAPISpec = context.package.directory.appending("openapi.yaml")
        let outputDir = context.pluginWorkDirectory.appending("Generated")
        return [
            .buildCommand(
                displayName: "Generating models from openapi.yaml",
                executable: try context.tool(named: "ModelGenerator").path,
                arguments: [openAPISpec.string, outputDir.string],
                inputFiles: [openAPISpec],
                outputFiles: [outputDir.appending("Models.swift")]
            )
        ]
    }
}
```

Now `swift build` (and Xcode's build) regenerates `Models.swift` automatically whenever `openapi.yaml` changes, with no separate script for anyone to remember.

## When a Manual Script Is Still Fine

One-off migrations, project scaffolding, or release tooling that runs outside the build graph (tagging a release, bumping a version file) don't belong in a build tool plugin — plugins are for codegen that must stay in sync with source on every build. Keep those as documented scripts in a `Scripts/` or `Tools/` directory instead of forcing them into the build graph where they don't belong.

## See Also

- [`proj-resource-bundle`](proj-resource-bundle.md) - the resource-declaration counterpart to plugin-generated code
- [`proj-spm-module-boundaries`](proj-spm-module-boundaries.md) - plugins are declared as SPM targets like any other module
- [`lint-analyze-build`](lint-analyze-build.md) - CI passes that run alongside plugin-driven builds
