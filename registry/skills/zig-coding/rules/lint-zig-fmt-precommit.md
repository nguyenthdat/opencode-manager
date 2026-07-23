# lint-zig-fmt-precommit

> Run `zig fmt` locally (ideally via a pre-commit hook) before committing

## Why It Matters

Catching a formatting issue locally, before it's committed, is strictly cheaper than catching it in CI (`lint-zig-fmt-ci`) — no failed build, no extra push-fix-push cycle, no code-review noise from an unrelated formatting diff mixed into a real change. A pre-commit hook makes this automatic instead of relying on everyone remembering to run `zig fmt` manually.

## Bad

```sh
# No pre-commit enforcement — formatting only gets caught (and fixed)
# after a CI failure on a pushed commit, once it's already visible to
# reviewers and other contributors.
git commit -m "add feature"
git push
# ... CI fails on zig fmt --check ...
```

## Good

```sh
# .git/hooks/pre-commit (or managed via a tool like pre-commit/lefthook)
#!/bin/sh
zig fmt --check . || {
    echo "Formatting issues found. Run 'zig fmt .' and re-commit."
    exit 1
}
```

```yaml
# .pre-commit-config.yaml (if using the pre-commit framework with a local hook)
repos:
  - repo: local
    hooks:
      - id: zig-fmt
        name: zig fmt
        entry: zig fmt --check
        language: system
        files: \.zig$
```

## Editor Integration Is Even Faster Feedback

Most editor Zig extensions (via the Zig Language Server, `zls`) can run `zig fmt` automatically on save — combined with a pre-commit hook as a backstop, this makes unformatted code essentially impossible to commit by accident.

## See Also

- [lint-zig-fmt-ci](lint-zig-fmt-ci.md) - the CI-side enforcement this local check is meant to make redundant
- [proj-build-steps-custom](proj-build-steps-custom.md) - wiring a `zig build fmt-check` step contributors can run directly
