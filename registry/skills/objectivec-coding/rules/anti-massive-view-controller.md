# anti-massive-view-controller

> Don't build a Massive View Controller that owns every responsibility

## Why It Matters

`UIViewController` subclasses have an open invitation to absorb responsibility — networking, data parsing, layout, table view data source/delegate, validation, analytics — because Apple's own APIs make it convenient to just add another method. The result ("Massive View Controller," a long-running joke about MVC in Cocoa) is a 2,000-line file nobody can safely change, where a one-line UI tweak requires understanding networking retry logic three screens away, and where the class is nearly impossible to unit test because it's entangled with `UIKit` lifecycle methods.

## Bad

```objc
@interface OMWProductViewController : UIViewController <UITableViewDataSource, UITableViewDelegate, NSURLSessionDataDelegate>
@end

@implementation OMWProductViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    [self fetchProducts];
    [self configureTableView];
    [self setupAnalytics];
}

- (void)fetchProducts {
    // 80 lines of raw NSURLSession setup, JSON parsing, retry logic,
    // and error handling, all inline in the view controller.
    NSURLSessionDataTask *task = [[NSURLSession sharedSession]
        dataTaskWithURL:[NSURL URLWithString:@"https://api.example.com/products"]
      completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        NSError *jsonError;
        NSArray *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
        // ... manual model parsing, cache writing, retry-on-failure ...
    }];
    [task resume];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return self.products.count;   // Data source logic mixed with
                                    // networking and view lifecycle.
}

- (void)setupAnalytics {
    // Analytics event wiring also lives here.
}

@end
```

## Good

```objc
// Networking extracted to its own object with a single responsibility.
@interface OMWProductRepository : NSObject
- (void)fetchProductsWithCompletion:(void (^)(NSArray<OMWProduct *> *products,
                                                 NSError *_Nullable error))completion;
@end
```

```objc
// Table data source extracted to its own object.
@interface OMWProductListDataSource : NSObject <UITableViewDataSource>
@property (nonatomic, copy) NSArray<OMWProduct *> *products;
@end
```

```objc
// The view controller now only coordinates: it owns none of the
// networking or data-source implementation details directly.
@interface OMWProductViewController : UIViewController
@property (nonatomic, strong) OMWProductRepository *repository;
@property (nonatomic, strong) OMWProductListDataSource *dataSource;
@end

@implementation OMWProductViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.tableView.dataSource = self.dataSource;
    [self.repository fetchProductsWithCompletion:^(NSArray<OMWProduct *> *products, NSError *error) {
        self.dataSource.products = products;
        [self.tableView reloadData];
    }];
}

@end
```

## How to Fix It

Extract by responsibility, not by size: a repository/service object for networking and persistence, a data-source object for table/collection view protocols, a view model or presenter for formatting data for display, and keep the view controller itself limited to wiring these together and responding to `UIViewController` lifecycle events.

## See Also

- [`api-single-responsibility-class`](api-single-responsibility-class.md) - Keep each class focused on one responsibility
- [`api-datasource-protocol-pattern`](api-datasource-protocol-pattern.md) - Use a data-source protocol to separate data supply from behavior
- [`proj-group-by-feature-not-type`](proj-group-by-feature-not-type.md) - Organize files by feature/module, not by type (all-models, all-views)
