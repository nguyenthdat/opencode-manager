# proj-bundler-convention

> Follow bundler/gem standard layout

## Why It Matters

Ruby projects have a well-established layout: lib/ for code, bin/ for executables, spec/ or test/ for tests. Consistency makes projects easy to navigate for new contributors.

## Bad

# Chaotic layout:
my_gem/
  my_gem.rb
  helper.rb
  main_script
```


## Good

```
my_gem/
  lib/
    my_gem.rb
    my_gem/
      version.rb
      client.rb
  bin/
    console
  spec/
    spec_helper.rb
    my_gem/
      client_spec.rb
  Gemfile
  my_gem.gemspec
  Rakefile
  README.md
  CHANGELOG.md
```


## See Also

- [proj-ruby-version-file](./proj-ruby-version-file.md)
- [proj-script-directory](./proj-script-directory.md)
