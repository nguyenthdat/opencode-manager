# test-ci-integration

> Output TAP format for CI integration

## Why It Matters

Bats natively outputs TAP (Test Anything Protocol) format, which is understood by all major CI/CD platforms (GitHub Actions, GitLab CI, Jenkins, Buildkite). TAP provides structured test results with pass/fail counts, timing, and diagnostic output. Ensuring TAP output in CI pipelines enables test result tracking, flaky test detection, and failure notifications.

## Bad

```bash
# CI script — no test output format specified
bats test_*.bats
# Unstructured output, hard to parse in CI

# No exit code propagation
bats test_*.bats || true  # CI always passes!
```

## Good

```bash
#!/usr/bin/env bash
# ci-test.sh
set -euo pipefail

echo "Running Bats tests..."
bats --formatter tap --recursive tests/

# Or with timing:
bats --formatter tap --timing tests/

# Or compact for less noise:
bats --formatter tap --print-output-on-failure tests/

# Exit code propagates to CI
```

## GitHub Actions Integration

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: sudo apt-get install -y bats shellcheck
      - run: bats --formatter tap tests/
      - run: shellcheck myscript.sh
```

## GitLab CI Integration

```yaml
# .gitlab-ci.yml
test:
  script:
    - apk add bats shellcheck
    - bats --formatter tap tests/
    - shellcheck myscript.sh
  artifacts:
    reports:
      junit: test-results.xml
```

## TAP Output Example

```
1..3
ok 1 parse_config returns defaults
ok 2 parse_config overrides with file
not ok 3 parse_config rejects invalid input
  (in test file tests/test_parse.bats, line 42)
    `[ "$status" -eq 1 ]' failed
```

## See Also

- [test-bats-framework](./test-bats-framework.md) - Bats framework
- [test-shellcheck-build](./test-shellcheck-build.md) - ShellCheck in test suite
