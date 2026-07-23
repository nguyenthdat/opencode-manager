# arc-timer-target-cycle

> Avoid `NSTimer`/`CADisplayLink` strong-target retain cycles

## Why It Matters

`NSTimer` and `CADisplayLink` both strongly retain their `target` for as long as they are scheduled on a runloop, and the runloop itself retains the timer/display link. If the target also owns a strong reference back to the timer (as a property), you get a three-way cycle: runloop retains timer, timer retains target, target retains timer. The object can never deallocate until something explicitly calls `invalidate`, which most code forgets to do, leaking the target and leaving the timer firing indefinitely against a "zombie" view controller.

## Bad

```objc
@interface OMWCountdownViewController ()
@property (nonatomic, strong) NSTimer *countdownTimer;  // Strong, and never invalidated
@end

@implementation OMWCountdownViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.countdownTimer = [NSTimer scheduledTimerWithTimeInterval:1.0
                                                             target:self   // Timer retains self
                                                           selector:@selector(tick)
                                                           userInfo:nil
                                                            repeats:YES];
    // self.countdownTimer retains the timer, the timer retains self: cycle.
    // viewDidDisappear never invalidates it, so this view controller (and its
    // whole view hierarchy) is leaked and keeps firing `tick` forever.
}

- (void)tick {
    self.secondsRemaining -= 1;
}

@end
```

## Good

```objc
@interface OMWCountdownViewController ()
@property (nonatomic, strong) NSTimer *countdownTimer;
@end

@implementation OMWCountdownViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.countdownTimer = [NSTimer scheduledTimerWithTimeInterval:1.0
                                                             target:self
                                                           selector:@selector(tick)
                                                           userInfo:nil
                                                            repeats:YES];
}

- (void)viewWillDisappear:(BOOL)animated {
    [super viewWillDisappear:animated];
    [self.countdownTimer invalidate];  // Breaks the runloop->timer->self chain
    self.countdownTimer = nil;
}

- (void)tick {
    self.secondsRemaining -= 1;
}

@end
```

## Block-Based Timer Still Needs Invalidation

```objc
// Block-based scheduling avoids a target/selector reference, but the timer
// itself still needs to be invalidated - and __weak self inside the block
// avoids yet another cycle through the block's own capture:
__weak __typeof__(self) weakSelf = self;
self.countdownTimer = [NSTimer scheduledTimerWithTimeInterval:1.0
                                                        repeats:YES
                                                          block:^(NSTimer *timer) {
    __strong __typeof__(self) strongSelf = weakSelf;
    if (!strongSelf) { [timer invalidate]; return; }
    strongSelf.secondsRemaining -= 1;
}];
```

## `CADisplayLink` Follows the Same Pattern

```objc
self.displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(renderFrame)];
[self.displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];

- (void)dealloc {
    [self.displayLink invalidate];  // Same strong-target cycle risk as NSTimer
}
```

## See Also

- [`arc-dealloc-observer-cleanup`](arc-dealloc-observer-cleanup.md) - Remove observers and invalidate timers in `dealloc`
- [`arc-weak-strong-self`](arc-weak-strong-self.md) - Capture `__weak self` then re-strengthen inside blocks to avoid retain cycles
- [`arc-unsafe-unretained-rare`](arc-unsafe-unretained-rare.md) - Reserve `unsafe_unretained` for rare non-`weak`-compatible cases
