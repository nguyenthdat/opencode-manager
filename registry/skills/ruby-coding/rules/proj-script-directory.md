# proj-script-directory

> Put scripts in bin/ or script/

## Why It Matters

Executable scripts should live in bin/ (for binstubs) or script/ (for project scripts). Don't scatter .rb scripts in the project root.

## Bad

# Scripts dumped in root:
project/
  deploy.rb
  seed_data.rb
  cleanup.rb
```


## Good

```
# bin/ for binstubs:
project/
  bin/
    rails
    rake
    setup
    console

# script/ for project scripts:
  script/
    deploy
    seed_data
    cleanup_old_records
```


## See Also

- [proj-bundler-convention](./proj-bundler-convention.md)
