# api-factory-methods

> Use class-level factory methods over complex initialize

## Why It Matters

When constructing an object requires multiple strategies or input formats, provide class-level factory methods (e.g., `from_json`, `from_csv`, `build_with_defaults`) instead of overloading `initialize`. This keeps `initialize` simple and makes construction intent explicit.

## Bad

```ruby
class Config
  def initialize(source = nil, format: nil, validate: true)
    if source.is_a?(String); @data = parse_file(source, format: format)
    elsif source.is_a?(Hash); @data = source
    else @data = default_config; end
    validate! if validate
  end
end
Config.new("file.yml", format: :yaml, validate: false)  # What does this do?
```

## Good

```ruby
class Config
  def initialize(data = {}); @data = data; end
  def self.from_file(path)
    data = case File.extname(path)
      when ".yml", ".yaml" then YAML.safe_load_file(path)
      when ".json" then JSON.parse(File.read(path))
      else raise ArgumentError, "Unsupported format"
    end
    new(data)
  end
  def self.from_env
    new(host: ENV["APP_HOST"], port: ENV.fetch("APP_PORT", 3000).to_i)
  end
end
Config.from_file("production.yml")
Config.from_env  # Intent is clear
```

## See Also

- [api-builder-pattern](./api-builder-pattern.md)
- [api-fluent-interface](./api-fluent-interface.md)
- [obj-initialize-super](./obj-initialize-super.md)
