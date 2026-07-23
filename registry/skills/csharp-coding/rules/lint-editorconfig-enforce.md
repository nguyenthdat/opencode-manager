# lint-editorconfig-enforce

> Enforce style rules with a checked-in `.editorconfig`, applied consistently across every editor and CI

## Why It Matters

Without a shared `.editorconfig`, formatting/style conventions live only in individual developers' heads (or IDE-specific settings that don't travel with the repo) - every pull request accumulates unrelated whitespace/style diffs as different developers' editors auto-format differently. A checked-in `.editorconfig` makes style rules part of the repository itself, enforced identically by every IDE and by `dotnet format`/CI.

## Bad

```text
(no .editorconfig in the repository)
Every developer's IDE uses its own default formatting rules - braces, spacing,
using-directive placement, and naming conventions all vary developer-to-developer.
```

## Good

```ini
# .editorconfig (repository root)
root = true

[*.cs]
indent_style = space
indent_size = 4
end_of_line = lf
insert_final_newline = true

csharp_style_namespace_declarations = file_scoped:warning
csharp_new_line_before_open_brace = all
dotnet_style_qualification_for_field = false:warning
dotnet_style_require_accessibility_modifiers = always:warning

# Naming conventions enforced as build warnings
dotnet_naming_rule.interfaces_should_be_prefixed.severity = warning
dotnet_naming_rule.interfaces_should_be_prefixed.symbols = interface_symbol
dotnet_naming_rule.interfaces_should_be_prefixed.style = prefix_interface_with_i
dotnet_naming_symbols.interface_symbol.applicable_kinds = interface
dotnet_naming_style.prefix_interface_with_i.required_prefix = I
```

## Enforcing Style as Build Warnings, Not Just IDE Suggestions

```xml
<PropertyGroup>
  <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  <!-- Without this, .editorconfig style rules only show as IDE squiggles -
       EnforceCodeStyleInBuild makes `dotnet build` itself report them. -->
</PropertyGroup>
```

## Per-Folder Overrides

```ini
# tests/.editorconfig - additional rules scoped to just the tests/ subtree
[*.cs]
dotnet_diagnostic.CS1591.severity = none # test projects don't need public API docs
```

## See Also

- [lint-format-verify-ci](lint-format-verify-ci.md) - Enforcing formatting in CI via dotnet format
- [lint-stylecop-analyzers](lint-stylecop-analyzers.md) - Analyzer-based style enforcement, complementary to .editorconfig
