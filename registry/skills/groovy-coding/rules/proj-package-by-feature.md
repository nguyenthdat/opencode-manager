# proj-package-by-feature

> Package by feature, not by type

## Why It Matters

Organizing packages by technical layer (`services/`, `models/`, `repositories/`) scatters related code across the package tree. Packaging by feature (`orders/`, `users/`, `billing/`) keeps related classes together, making it easier to find, understand, and modify a feature's complete implementation.

## Bad

```
com.example/
├── controllers/
│   ├── UserController.groovy
│   └── OrderController.groovy
├── services/
│   ├── UserService.groovy
│   └── OrderService.groovy
├── repositories/
│   ├── UserRepository.groovy
│   └── OrderRepository.groovy
└── models/
    ├── User.groovy
    └── Order.groovy
```

## Good

```
com.example/
├── user/
│   ├── User.groovy
│   ├── UserController.groovy
│   ├── UserService.groovy
│   └── UserRepository.groovy
├── order/
│   ├── Order.groovy
│   ├── OrderController.groovy
│   ├── OrderService.groovy
│   └── OrderRepository.groovy
├── billing/
│   ├── Invoice.groovy
│   ├── PaymentService.groovy
│   └── BillingRepository.groovy
└── shared/
    ├── Auditable.groovy
    ├── BaseController.groovy
    └── validation/
        └── Validators.groovy
```

## See Also

- [proj-gradle-convention](proj-gradle-convention.md) - Follow Gradle standard layout
- [name-package-lowercase](name-package-lowercase.md) - Lowercase package names
- [proj-script-vs-library](proj-script-vs-library.md) - Distinguish scripts from libraries
