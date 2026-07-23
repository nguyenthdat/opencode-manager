# meta-singleton-class

> Understand singleton class (eigenclass) patterns

## Why It Matters

Every Ruby object has a hidden singleton class (eigenclass) that holds methods unique to that object. Understanding it is essential for class methods, `extend`, and per-object behavior. The `class << obj` syntax opens the singleton class.

Use `class << self` inside a class/module body to define class methods.


## Bad

```ruby
class Logger
  def Logger.info(msg)   # Hardcodes class name
    puts "[INFO] #{msg}"
  end

  def Logger.error(msg)
    puts "[ERROR] #{msg}"
  end
end

# Inheriting breaks:
class FileLogger < Logger
  # FileLogger.info calls Logger.info -- wrong!
end
```


## Good

```ruby
class Logger
  class << self
    def info(msg)
      puts "[INFO] #{msg}"
    end

    def error(msg)
      puts "[ERROR] #{msg}"
    end
  end
end

# Or use module for class methods:
module Loggable
  def info(msg)
    puts "[INFO] #{msg}"
  end
end

class FileLogger
  extend Loggable  # Adds info, error as class methods
end

# Singleton class for a single object:
logger = Logger.new
class << logger
  attr_accessor :context  # Only this instance has context
end
```


## See Also

- [meta-macro-module](./meta-macro-module.md)
- [obj-module-method](./obj-module-method.md)
