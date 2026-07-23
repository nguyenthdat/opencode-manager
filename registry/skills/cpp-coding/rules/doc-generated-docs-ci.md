# doc-generated-docs-ci

> Build Doxygen docs in CI to catch broken references

## Why It Matters

Doxygen comments rot silently if nothing ever regenerates and checks the output: a `\see` referencing a renamed function, a broken `\code` block, or an undocumented new public member won't surface until someone happens to browse the generated docs (if anyone ever does). Running Doxygen in CI with warnings treated as errors catches documentation drift the same way compiler warnings catch code drift.

## Bad

```yaml
# Docs are generated manually, occasionally, by whoever remembers to —
# broken cross-references and undocumented new public API accumulate
# silently between those manual runs.
```

## Good

```yaml
docs:
  script:
    - doxygen Doxyfile 2> doxygen_warnings.log
    - |
      if [ -s doxygen_warnings.log ]; then
        echo "Doxygen warnings found:"
        cat doxygen_warnings.log
        exit 1
      fi
```

```
# Doxyfile (relevant settings)
WARN_AS_ERROR    = FAIL_ON_WARNINGS
WARN_IF_UNDOCUMENTED = YES
WARN_IF_DOC_ERROR    = YES
```

## Publish the Output for Easy Browsing

```yaml
docs-deploy:
  script:
    - doxygen Doxyfile
    - publish_to_docs_site html/   # e.g. GitHub Pages, internal docs host
  only:
    - main
```

## See Also

- [doc-doxygen-public-api](doc-doxygen-public-api.md) - The documentation being generated and validated
- [lint-compiler-warnings-as-errors](lint-compiler-warnings-as-errors.md) - The analogous warnings-as-errors practice for code
- [doc-example-usage](doc-example-usage.md) - `\code` blocks that Doxygen validation helps keep correct
