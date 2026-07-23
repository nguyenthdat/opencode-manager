# raii-avoid-two-phase-init

> Avoid two-phase init; fully construct in the constructor

## Why It Matters

A class that requires "construct, then call `init()` before use" allows objects to exist in an invalid, half-constructed state — every method must check whether `init()` was called. RAII's core promise is that a fully-constructed object is a valid, usable object. Do all initialization (including anything fallible) in the constructor, and use factory functions returning `std::optional`/`std::expected` when construction can fail.

## Bad

```cpp
class Connection {
public:
    Connection() = default;

    bool init(const std::string& host, int port) {
        socket_ = ::connect(host, port);
        return socket_ >= 0;
    }

    void send(std::string_view data) {
        // Must remember to check init() succeeded before every use!
        if (socket_ < 0) throw std::logic_error("not initialized");
        ::send(socket_, data.data(), data.size(), 0);
    }
private:
    int socket_ = -1;
};

// Caller can forget init(), or use before checking its result
Connection c;
c.init("localhost", 8080);   // Return value ignored!
c.send("hello");             // UB-adjacent: uses an unconnected socket
```

## Good

```cpp
class Connection {
public:
    // Private constructor: only reachable through the validating factory
    static std::optional<Connection> create(const std::string& host, int port) {
        int socket = ::connect(host, port);
        if (socket < 0) return std::nullopt;
        return Connection(socket);
    }

    void send(std::string_view data) {
        ::send(socket_, data.data(), data.size(), 0);   // socket_ always valid
    }

    ~Connection() { if (socket_ >= 0) ::close(socket_); }

private:
    explicit Connection(int socket) : socket_(socket) {}
    int socket_;
};

// Usage: no way to get an object that isn't fully initialized
if (auto conn = Connection::create("localhost", 8080)) {
    conn->send("hello");
} else {
    // Handle connection failure
}
```

## See Also

- [err-expected-for-recoverable](err-expected-for-recoverable.md) - `std::expected` as the factory return type
- [raii-scope-bound-resources](raii-scope-bound-resources.md) - The RAII principle this rule supports
- [api-explicit-constructors](api-explicit-constructors.md) - Constructor design more broadly
