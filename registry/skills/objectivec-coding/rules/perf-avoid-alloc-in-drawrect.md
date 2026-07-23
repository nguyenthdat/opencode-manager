# perf-avoid-alloc-in-drawrect

> Avoid allocating objects inside `drawRect:`/render loops

## Why It Matters

`drawRect:` runs on every screen refresh a view needs redrawing — potentially 60-120 times per second during scrolling or animation. Allocating `NSString`, `UIBezierPath`, `NSDictionary`, or `NSNumberFormatter` instances inside it puts allocator and Autorelease Pool churn on the critical rendering path, causing dropped frames that show up as visible stutter.

## Bad

```objc
- (void)drawRect:(CGRect)rect {
    // Allocates a new formatter on every single frame
    NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
    formatter.numberStyle = NSNumberFormatterDecimalStyle;
    NSString *label = [formatter stringFromNumber:@(self.value)];

    // Allocates a new paragraph style and attributes dictionary per frame
    NSMutableParagraphStyle *style = [[NSMutableParagraphStyle alloc] init];
    style.alignment = NSTextAlignmentCenter;
    NSDictionary *attrs = @{NSParagraphStyleAttributeName: style,
                             NSFontAttributeName: [UIFont systemFontOfSize:14]};

    [label drawInRect:rect withAttributes:attrs];

    // Allocates a fresh bezier path every frame even though the shape is fixed
    UIBezierPath *path = [UIBezierPath bezierPathWithRoundedRect:rect cornerRadius:8];
    [path stroke];
}
```

## Good

```objc
@interface OMWScoreBadgeView ()
@property (nonatomic, strong) NSNumberFormatter *formatter;
@property (nonatomic, strong) NSDictionary<NSAttributedStringKey, id> *textAttributes;
@end

@implementation OMWScoreBadgeView

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        // Built once, reused across every draw pass
        _formatter = [[NSNumberFormatter alloc] init];
        _formatter.numberStyle = NSNumberFormatterDecimalStyle;

        NSMutableParagraphStyle *style = [[NSMutableParagraphStyle alloc] init];
        style.alignment = NSTextAlignmentCenter;
        _textAttributes = @{NSParagraphStyleAttributeName: style,
                              NSFontAttributeName: [UIFont systemFontOfSize:14]};
    }
    return self;
}

- (void)drawRect:(CGRect)rect {
    NSString *label = [self.formatter stringFromNumber:@(self.value)];
    [label drawInRect:rect withAttributes:self.textAttributes];

    // Cache the path too, and only rebuild it when bounds actually change
    [self.cachedRoundedRectPath stroke];
}

- (void)layoutSubviews {
    [super layoutSubviews];
    self.cachedRoundedRectPath = [UIBezierPath bezierPathWithRoundedRect:self.bounds
                                                              cornerRadius:8];
}

@end
```

## When Per-Frame Allocation Is Unavoidable

```objc
// If the drawn content is genuinely data-dependent and must be rebuilt
// (e.g., a CGPath following live audio waveform samples), wrap the pass
// in @autoreleasepool so Foundation temporaries don't accumulate across
// many rapid draw calls before the run loop drains its own pool.
- (void)drawRect:(CGRect)rect {
    @autoreleasepool {
        CGMutablePathRef path = CGPathCreateMutable();
        for (NSNumber *sample in self.waveformSamples) {
            // path construction driven by live data — can't be cached
        }
        CGContextAddPath(UIGraphicsGetCurrentContext(), path);
        CGContextStrokePath(UIGraphicsGetCurrentContext());
        CGPathRelease(path);
    }
}
```

## See Also

- [`perf-profile-instruments-first`](perf-profile-instruments-first.md) - Profile with Instruments before optimizing
- [`arc-autoreleasepool-loop`](arc-autoreleasepool-loop.md) - Wrap tight allocation loops in `@autoreleasepool`
- [`perf-lazy-property-initialization`](perf-lazy-property-initialization.md) - Lazily initialize expensive properties on first access
