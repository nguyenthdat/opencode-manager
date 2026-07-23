# name-abbrev-cautious

> Spell out abbreviations unless well-known

## Why It Matters

Abbreviated names save a few keystrokes but cost readability. `usrSvc` forces every reader to decode "user service." Common, well-known acronyms like `URL`, `HTTP`, `JSON`, and `XML` are acceptable because they're universally understood. When in doubt, spell it out.

## Bad

```groovy
class UsrSvc { }                  // "UserService" — save 5 chars, lose clarity
class CfgMgr { }                  // "ConfigManager"
def calcTot(ord) { }              // "calculateTotal(order)"

class ApiResponseBuilder { }      // "API" is accepted; "Api" is fine in camelCase
```

## Good

```groovy
class UserService { }
class ConfigManager { }
def calculateTotal(Order order) { }

// Well-known acronyms are acceptable
class HTTPClient { }
class URLParser { }
class JSONSerializer { }
class XMLBuilder { }

// Two-letter acronyms stay uppercase
class IOService { }               // Not Ioservice
class DBConnection { }            // Not DbConnection
class UIPanel { }                 // Not UiPanel
```

## See Also

- [name-classes-PascalCase](name-classes-PascalCase.md) - Use PascalCase for classes
- [name-methods-camelCase](name-methods-camelCase.md) - Use camelCase for methods
- [name-constants-UPPER_SNAKE](name-constants-UPPER_SNAKE.md) - UPPER_SNAKE_CASE for constants
