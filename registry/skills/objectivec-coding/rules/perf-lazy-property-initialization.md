# perf-lazy-property-initialization

> Lazily initialize expensive properties on first access

## Why It Matters

Eagerly constructing every property in `init` means every object pays the full cost of its most expensive dependency (a date formatter, a regex, a parsed asset) even when that dependency is never used — for example, a view controller that builds an `NSDateFormatter` in `init` even though the user never scrolls to the screen that needs it. Lazy initialization defers that cost to the first (and only) call site that actually needs it.

## Bad

```objc
@implementation OMWTransactionCell

- (instancetype)initWithStyle:(UITableViewCellStyle)style
              reuseIdentifier:(NSString *)reuseIdentifier {
    self = [super initWithStyle:style reuseIdentifier:reuseIdentifier];
    if (self) {
        // Built on every single cell instantiation, even for cells whose
        // rows never display a currency-formatted amount.
        _currencyFormatter = [[NSNumberFormatter alloc] init];
        _currencyFormatter.numberStyle = NSNumberFormatterCurrencyStyle;
        _currencyFormatter.locale = [NSLocale currentLocale];
    }
    return self;
}

@end
```

## Good

```objc
@interface OMWTransactionCell ()
@property (nonatomic, strong, nullable) NSNumberFormatter *currencyFormatter;
@end

@implementation OMWTransactionCell

// No formatter built in init at all.

- (NSNumberFormatter *)currencyFormatter {
    if (_currencyFormatter == nil) {
        _currencyFormatter = [[NSNumberFormatter alloc] init];
        _currencyFormatter.numberStyle = NSNumberFormatterCurrencyStyle;
        _currencyFormatter.locale = [NSLocale currentLocale];
    }
    return _currencyFormatter;
}

- (void)configureWithAmount:(NSDecimalNumber *)amount {
    self.amountLabel.text = [self.currencyFormatter stringFromNumber:amount];
}

@end
```

## Thread-Safety Caveat

```objc
// The lazy getter above is only safe if the property is always accessed
// from one thread (e.g. main thread for a UITableViewCell). For a lazily
// initialized singleton-like value accessed from multiple queues, guard
// the check-and-set with dispatch_once instead:
- (NSRegularExpression *)emailRegex {
    static NSRegularExpression *regex;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        regex = [NSRegularExpression regularExpressionWithPattern:@"^[^@]+@[^@]+$"
                                                            options:0
                                                              error:nil];
    });
    return regex;
}
```

## Don't Lazily Initialize Cheap Properties

```objc
// Overkill: a lazy getter adds a branch and ivar-nil check on every
// access for something that costs nothing to build eagerly.
- (NSMutableArray *)items {
    if (_items == nil) {
        _items = [NSMutableArray array]; // trivial cost — just init it in -init instead
    }
    return _items;
}
```

## See Also

- [`perf-nscache-memory-sensitive-cache`](perf-nscache-memory-sensitive-cache.md) - Use `NSCache` instead of a plain dictionary for memory-sensitive caches
- [`conc-dispatch-once-singleton`](conc-dispatch-once-singleton.md) - Use `dispatch_once` for thread-safe singleton/lazy initialization
- [`perf-avoid-alloc-in-drawrect`](perf-avoid-alloc-in-drawrect.md) - Avoid allocating objects inside `drawRect:`/render loops
