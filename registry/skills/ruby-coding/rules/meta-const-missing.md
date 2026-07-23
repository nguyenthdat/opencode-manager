# meta-const-missing

> Use const_missing for autoloading patterns

## Why It Matters

Overriding `const_missing` allows lazy-loading constants on first reference. Rails' autoloading is built on this pattern. When implementing `const_missing`, always call `super` for unknown constants to preserve Ruby's normal `NameError` behavior.

Only use this when truly needed — most applications can rely on `require`/`autoload` or `Zeitwerk`.


## Bad

```ruby
module MyApp
  def self.const_missing(name)
    # Forgot to call super -- ALL missing constants are silently handled!
    nil
  end
end

MyApp::NonExistent  # Returns nil silently -- bugs hide!
```


## Good

```ruby
module MyApp
  def self.const_missing(name)
    filename = name.to_s
      .gsub(/([a-z])([A-Z])/) { "#{$1}_#{$2}" }
      .downcase

    begin
      require "my_app/#{filename}"
    rescue LoadError
      super  # Not our constant -- let Ruby raise NameError
    end

    if const_defined?(name, false)
      const_get(name)
    else
      super  # File loaded but constant not defined -- still a NameError
    end
  end
end
```


## See Also

- [meta-method-missing](./meta-method-missing.md)
- [meta-hook-safe](./meta-hook-safe.md)
