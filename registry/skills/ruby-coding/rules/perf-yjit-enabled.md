# perf-yjit-enabled

> Run with YJIT enabled (Ruby 3.3+ default)

## Why It Matters

YJIT (Yet Another Just-In-Time compiler) significantly improves CPU-bound Ruby performance with near-zero warm-up overhead. Enabled by default in Ruby 3.3+ on x86-64/arm64. Ensure it's activated in production.

## Bad

# Running without YJIT -- leaving performance on the table
# Rails production defaults sometimes disable it
# ruby --yjit server.rb
```


## Good

```ruby
# config/initializers/yjit.rb
if defined?(RubyVM::YJIT.enable)
  Rails.application.config.after_initialize do
    RubyVM::YJIT.enable
  end
end

# Or via environment:
# RUBY_YJIT_ENABLE=1 rails server

# Verify it's active:
puts "YJIT: #{RubyVM::YJIT.enabled?}"  # => true
```


## See Also

- [perf-freeze-strings](./perf-freeze-strings.md)
