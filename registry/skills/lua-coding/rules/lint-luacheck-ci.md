# lint-luacheck-ci

> Run `luacheck` in CI to catch unused variables and global leaks automatically

## Why It Matters

Manual code review reliably misses a missing `local` keyword or an unused variable — these are exactly the mechanical, easy-to-overlook mistakes a linter catches instantly and consistently. Running `luacheck` in CI means a `scope-no-accidental-global`-style bug fails the build instead of shipping.

## Bad

```yaml
# .github/workflows/ci.yml -- no linting step at all, only tests
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: luarocks install busted
      - run: busted
```

## Good

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: leafo/gh-actions-lua@v10
      - uses: leafo/gh-actions-luarocks@v4
      - run: luarocks install luacheck
      - run: luacheck .

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - run: luarocks install busted
      - run: busted
```

```sh
# Exit code is non-zero on any warning/error, so CI fails automatically
luacheck . --config .luacheckrc
```

## Make the Check Fast to Run Locally Too

Add a Makefile/task-runner target so contributors run the exact same check before pushing, catching issues before CI even runs:

```makefile
lint:
	luacheck .

test: lint
	busted
```

## See Also

- [lint-luacheckrc-config](lint-luacheckrc-config.md)
- [lint-unused-variable](lint-unused-variable.md)
- [scope-no-accidental-global](scope-no-accidental-global.md)
