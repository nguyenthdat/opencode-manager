# anti-god-class

> Don't build God classes with too many responsibilities

## Why It Matters

A class that owns network I/O, business logic, persistence, and UI rendering all at once becomes hard to test (every test drags in every dependency), hard to reason about (any change risks breaking unrelated functionality), and hard to reuse (you can't use just the part you need).

## Bad

```cpp
class ApplicationManager {
public:
    void connect_to_server();
    void parse_config_file();
    void render_ui();
    void save_to_database();
    void handle_user_input();
    void compute_business_logic();
    void send_analytics_event();
    // ... 40 more unrelated methods, hundreds of member variables ...
};
```

## Good

```cpp
class NetworkClient { public: void connect(); };
class ConfigParser { public: Config parse(const std::string& path); };
class UiRenderer { public: void render(const AppState& state); };
class Database { public: void save(const Record& r); };
class BusinessLogic { public: Decision decide(const Input& input); };

class Application {   // Orchestrates the focused, single-purpose collaborators
public:
    Application(NetworkClient&, ConfigParser&, UiRenderer&, Database&, BusinessLogic&);
    void run();
private:
    NetworkClient& network_;
    ConfigParser& config_;
    UiRenderer& ui_;
    Database& db_;
    BusinessLogic& logic_;
};
```

## See Also

- [api-interface-segregation](api-interface-segregation.md) - Keeping interfaces (not just classes) small
- [test-gmock-interfaces](test-gmock-interfaces.md) - Testability benefits of decomposed dependencies
- [api-rule-of-zero-value-types](api-rule-of-zero-value-types.md) - Small, focused value types as a building block
