# proj-examples-dir

> Keep runnable examples in an `examples/` directory, wired into `build.zig` as their own executables

## Why It Matters

A library's doc comments (`doc-examples-runnable`) show small usage snippets, but a full, runnable example program — demonstrating realistic setup, error handling, and cleanup end-to-end — helps new users far more than prose alone. Wiring each example into `build.zig` as its own small executable means `zig build` keeps them compiling correctly as the library evolves, instead of letting them silently rot.

## Bad

```
repo/
  src/root.zig
  README.md   # a code snippet in prose, never compiled, quietly out of
              # date after the library's API changed six months ago
```

## Good

```
repo/
  src/root.zig
  examples/
    basic_usage.zig
    custom_allocator.zig
  build.zig    # wires each example into its own buildable/runnable target
```

```zig
// build.zig (excerpt)
const example = b.addExecutable(.{
    .name = "basic_usage",
    .root_source_file = b.path("examples/basic_usage.zig"),
    .target = target,
    .optimize = optimize,
});
example.root_module.addImport("my_lib", lib_mod);
b.installArtifact(example);

const run_example = b.addRunArtifact(example);
const example_step = b.step("example-basic", "Run the basic usage example");
example_step.dependOn(&run_example.step);
```

```sh
zig build example-basic
```

## See Also

- [doc-examples-runnable](doc-examples-runnable.md) - the smaller, doc-comment-level counterpart to full examples
- [proj-build-steps-custom](proj-build-steps-custom.md) - defining the `zig build example-*` steps shown above
- [doc-readme-build](doc-readme-build.md) - pointing new users toward the examples directory from the README
