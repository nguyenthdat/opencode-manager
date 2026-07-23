# proj-ruby-version-file

> Commit .ruby-version

## Why It Matters

.ruby-version declares the Ruby version for the project. Tools like rbenv, chruby, and asdf use it to auto-switch Ruby versions. Heroku uses it to select the buildpack version.

## Bad

# No .ruby-version -- developers use different Ruby versions
# "Works on my machine" with Ruby 3.0, breaks on 3.3
```


## Good

```
# .ruby-version
3.3.5

# Gemfile
ruby ">= 3.3.0"
```


## See Also

- [proj-gemfile-pin](./proj-gemfile-pin.md)
- [proj-dotenv-management](./proj-dotenv-management.md)
