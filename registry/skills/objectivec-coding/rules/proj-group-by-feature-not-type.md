# proj-group-by-feature-not-type

> Organize files by feature/module, not by type (all-models, all-views)

## Why It Matters

Grouping by technical layer (`Models/`, `Views/`, `Controllers/`) scatters everything one feature needs across three or four unrelated folders, so a single change to "checkout" touches files in every top-level group and Xcode's file navigator gives no sense of which files belong together. Grouping by feature keeps the cohesive unit — model, view, controller, and their tests — next to each other, so deleting or extracting a feature is a matter of deleting or moving one folder.

## Bad

```
OMWStore/
  Models/
    OMWCheckoutOrder.h/.m
    OMWCheckoutPayment.h/.m
    OMWProductListing.h/.m
    OMWUserProfile.h/.m
  Views/
    OMWCheckoutSummaryView.h/.m
    OMWProductCell.h/.m
    OMWProfileHeaderView.h/.m
  Controllers/
    OMWCheckoutViewController.h/.m
    OMWProductListViewController.h/.m
    OMWProfileViewController.h/.m
// To understand or remove "Checkout", you must hunt through three
// separate top-level folders and hope you found every related file.
```

## Good

```
OMWStore/
  Checkout/
    OMWCheckoutOrder.h/.m
    OMWCheckoutPayment.h/.m
    OMWCheckoutSummaryView.h/.m
    OMWCheckoutViewController.h/.m
    OMWCheckoutViewControllerTests.m
  ProductCatalog/
    OMWProductListing.h/.m
    OMWProductCell.h/.m
    OMWProductListViewController.h/.m
  Profile/
    OMWUserProfile.h/.m
    OMWProfileHeaderView.h/.m
    OMWProfileViewController.h/.m
// Deleting the Checkout feature is deleting one folder; a new engineer
// can see everything Checkout owns in one place.
```

## Shared Infrastructure Is Its Own Feature

```
OMWStore/
  Checkout/
  ProductCatalog/
  Profile/
  Core/
    OMWNetworkClient.h/.m
    OMWPersistenceStore.h/.m
    OMWAnalyticsLogger.h/.m
// Cross-cutting infrastructure used by every feature gets its own
// "Core" group rather than being force-fit into Models/Views/Controllers.
```

## See Also

- [`proj-one-class-per-file`](proj-one-class-per-file.md) - Keep one primary class per file, named to match
- [`api-single-responsibility-class`](api-single-responsibility-class.md) - Keep each class focused on one responsibility
- [`anti-massive-view-controller`](anti-massive-view-controller.md) - Don't build a Massive View Controller that owns every responsibility
