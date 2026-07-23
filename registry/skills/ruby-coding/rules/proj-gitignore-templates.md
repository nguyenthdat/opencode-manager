# proj-gitignore-templates

> Include standard Ruby ignores

## Why It Matters

A proper .gitignore prevents committing generated files, dependencies, and secrets. Use GitHub's Ruby .gitignore template as a starting point.

## Bad

# Minimal .gitignore -- leaks secrets and local config:
node_modules/
```


## Good

```
# .gitignore
*.gem
*.rbc
.bundle/
vendor/bundle/
db/*.sqlite3
log/
tmp/
.env
.env.local
config/credentials/*.key
.ruby-version  # Some teams prefer to commit this
```


## See Also

- [proj-dotenv-management](./proj-dotenv-management.md)
- [proj-ruby-version-file](./proj-ruby-version-file.md)
