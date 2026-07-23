# sec-path-traversal

> Validate file paths; use File.join and File.basename

## Why It Matters

Path traversal attacks use ../ sequences to access files outside the intended directory. Always validate user-supplied filenames and construct paths with File.join and File.basename to strip traversal attempts.

## Bad

```ruby
def download(filename)
  path = "/var/uploads/#{filename}"
  # Attacker: filename = "../../etc/passwd"
  File.read(path)
end

def show_image(name)
  # Attacker: name = "../../config/database.yml"
  send_file Rails.root.join("public", "images", name)
end
```


## Good

```ruby
def download(filename)
  safe_name = File.basename(filename)  # Strips directories
  path = Rails.root.join("uploads", safe_name)
  raise "Not found" unless File.exist?(path)
  send_file path
end

def show_image(name)
  safe_name = File.basename(name)
  path = Rails.root.join("public", "images", safe_name)
  # Verify the resolved path stays within the allowed directory
  unless path.to_s.start_with?(
    Rails.root.join("public", "images").to_s
  )
    raise "Invalid path"
  end
  send_file path if File.exist?(path)
end
```


## See Also

- [sec-no-eval](./sec-no-eval.md)
- [sec-sql-injection](./sec-sql-injection.md)
