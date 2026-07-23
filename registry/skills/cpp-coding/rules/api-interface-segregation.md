# api-interface-segregation

> Keep interfaces small and focused

## Why It Matters

A large abstract base class with many unrelated virtual methods forces every implementer to provide (or stub out) methods it doesn't logically need, and forces every caller to depend on the whole interface even if it only uses a fraction of it. Splitting into small, single-purpose interfaces lets types implement exactly what they support, and callers depend only on what they actually use.

## Bad

```cpp
class Device {
public:
    virtual void read(std::span<std::byte> buffer) = 0;
    virtual void write(std::span<const std::byte> data) = 0;
    virtual void seek(size_t position) = 0;
    virtual void flush() = 0;
    virtual void configure_network(const NetworkConfig&) = 0;   // Not every device is networked!
    virtual ~Device() = default;
};

class SerialPort : public Device {
public:
    void configure_network(const NetworkConfig&) override {
        throw std::logic_error("SerialPort has no network config");  // Forced stub
    }
    // ...
};
```

## Good

```cpp
class Readable {
public:
    virtual void read(std::span<std::byte> buffer) = 0;
    virtual ~Readable() = default;
};

class Writable {
public:
    virtual void write(std::span<const std::byte> data) = 0;
    virtual ~Writable() = default;
};

class NetworkConfigurable {
public:
    virtual void configure_network(const NetworkConfig&) = 0;
    virtual ~NetworkConfigurable() = default;
};

class SerialPort : public Readable, public Writable {
    // Only implements the interfaces it actually supports
};

class NetworkSocket : public Readable, public Writable, public NetworkConfigurable {
    // Implements all three, because it genuinely supports all three
};
```

## See Also

- [api-strong-types-over-bool](api-strong-types-over-bool.md) - Precise typing applies to interfaces too
- [anti-god-class](anti-god-class.md) - The class-design anti-pattern this rule prevents
- [tmpl-concepts-over-sfinae](tmpl-concepts-over-sfinae.md) - Compile-time "interfaces" via concepts as an alternative
