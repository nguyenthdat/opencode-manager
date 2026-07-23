# doc-readme-gems

> Standard README structure for gems

## Why It Matters

A good README is the front door to your gem. Include: name, description, installation, basic usage, configuration, API overview, contributing, and license. Generate a template with `bundle gem my_gem`.

## Bad

# MyGem

This is a gem.
```


## Good

# MyGem

A Ruby gem for processing widget data.

## Installation

Add to your Gemfile:
gem "my_gem", "~> 1.0"

## Usage
```ruby
require "my_gem"
MyGem.process(data)
```

## Development
Run tests `bundle exec rspec`.

## Contributing
Bug reports and pull requests welcome.
```


## See Also

- [proj-bundler-convention](./proj-bundler-convention.md)
