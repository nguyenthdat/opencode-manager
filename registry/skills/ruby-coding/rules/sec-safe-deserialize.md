# sec-safe-deserialize

> Never YAML.load untrusted input; use YAML.safe_load

## Why It Matters

YAML.load can deserialize arbitrary Ruby objects, enabling RCE via crafted YAML. YAML.safe_load only deserializes primitive types and is safe for untrusted input. Same caution applies to Marshal.load and JSON.load (use JSON.parse instead).

## Bad

```ruby
config = YAML.load(params[:config])       # RCE via crafted YAML
data = YAML.load_file(user_uploaded_file)
obj = Marshal.load(params[:data])          # RCE via crafted Marshal data
hash = JSON.load(user_input)              # JSON.load creates arbitrary objects
```


## Good

```ruby
# YAML -- use safe_load for untrusted data:
config = YAML.safe_load(params[:config])
data = YAML.safe_load_file(user_uploaded_file)

# With permitted_classes for specific needs:
config = YAML.safe_load(
  params[:config],
  permitted_classes: [Date, Time, Symbol]
)

# JSON -- use parse, not load:
hash = JSON.parse(user_input)

# Marshal -- never use with untrusted data
```


## See Also

- [sec-no-eval](./sec-no-eval.md)
- [sec-regex-dos](./sec-regex-dos.md)
