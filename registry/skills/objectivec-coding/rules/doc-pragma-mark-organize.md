# doc-pragma-mark-organize

> Use `#pragma mark -` to organize file sections

## Why It Matters

Xcode's jump bar and minimap read `#pragma mark` directives to build a navigable outline of a file. A 600-line view controller with no marks forces every reader to scroll and re-scan linearly to find, say, `UITableViewDataSource` methods versus private helpers; with marks, the jump bar becomes a table of contents and code review is dramatically faster.

## Bad

```objc
@implementation OMWProfileViewController

- (void)viewDidLoad { ... }
- (void)viewWillAppear:(BOOL)animated { ... }
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section { ... }
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath { ... }
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath { ... }
- (IBAction)logoutButtonTapped:(id)sender { ... }
- (void)reloadUserData { ... }
// No structure at all — jump bar just lists every method flat

@end
```

## Good

```objc
@implementation OMWProfileViewController

#pragma mark - Lifecycle

- (void)viewDidLoad { ... }
- (void)viewWillAppear:(BOOL)animated { ... }

#pragma mark - UITableViewDataSource

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section { ... }
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath { ... }

#pragma mark - UITableViewDelegate

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath { ... }

#pragma mark - Actions

- (IBAction)logoutButtonTapped:(id)sender { ... }

#pragma mark - Private Helpers

- (void)reloadUserData { ... }

@end
```

## Marking Protocol Conformance Groups

```objc
// Group every method belonging to one adopted protocol under one mark,
// even if the class adopts several protocols, so the jump bar mirrors
// the @interface's protocol list.
#pragma mark - OMWDownloadDelegate

- (void)downloader:(OMWImageDownloader *)downloader didFinishWithImage:(UIImage *)image { ... }
- (void)downloader:(OMWImageDownloader *)downloader didFailWithError:(NSError *)error { ... }
```

## A Bare `#pragma mark -` Draws a Divider

```objc
// Without text, this draws only a horizontal separator in the jump bar —
// useful between an unrelated block of overrides and the next named section.
#pragma mark -

- (void)dealloc { ... }
```

## See Also

- [`doc-public-header-comments-only`](doc-public-header-comments-only.md) - Put doc comments in the public header, not the implementation
- [`api-class-extension-private-api`](api-class-extension-private-api.md) - Hide private properties/methods in a class-extension (anonymous category)
- [`proj-one-class-per-file`](proj-one-class-per-file.md) - Keep one primary class per file, named to match
