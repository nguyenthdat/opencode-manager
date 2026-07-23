# Architecture Styles — Detailed Decision Notes

Each entry: the pressure that justifies the style, what it costs, when NOT to reach for it, and a short worked example of the style looking tempting for the wrong reason. Use this alongside Section 2 of `SKILL.md`; the summary table there is the quick-reference, this is the depth behind it.

## Layered / n-tier

**Pressure:** A single, coherent domain model that one team can hold in their heads, where separating "presentation," "domain/business logic," and "data access" concerns gives enough clarity without needing independent deployability.

**Cost:** Layering describes *dependency direction*, not real isolation — under time pressure, lower layers get pulled upward (a controller reaching into the ORM directly) and the layers stop meaning anything. Layering also doesn't help when the actual complexity is in *cross-cutting* concerns (auth, logging, tracing) that touch every layer anyway.

**Don't use when:** The domain already has genuinely independent subdomains with different lifecycles, teams, or scaling needs. Forcing them into shared layers hides the real seams instead of expressing them — you end up with a "service layer" that's actually three unrelated domains glued together.

**Looked right but wasn't:** A team layers a growing internal tool into presentation/business/data tiers because "that's how you structure an app." Two years later, three unrelated domains (billing, reporting, user management) all live in the same "business layer," each change risks the other two, and nobody can say who owns what. The pressure was never "one coherent model" — it was three models sharing a repo by accident.

## Hexagonal / ports-and-adapters

**Pressure:** Core domain logic must remain testable and swappable against multiple real or fake externals — a database today, an in-memory fake in tests, potentially a different vendor tomorrow. The domain core shouldn't know or care which adapter is plugged in.

**Cost:** Every port is an interface plus at least one adapter to maintain, which is pure overhead when there's only ever going to be one adapter. It also adds a layer of indirection that a newcomer has to learn before they can trace a call end to end.

**Don't use when:** The "core" is a thin pass-through to one datastore with no real domain logic to protect — e.g., a CRUD service whose entire job is "validate, then write a row." Hexagonal architecture on a codebase with one adapter and no domain rules is ceremony, not protection (see `codebase-design`'s "one adapter means a hypothetical seam" — the same logic applies here at the service level).

**Looked right but wasn't:** A service is built hexagonally "for testability" even though it has exactly one production adapter (Postgres) and the domain logic is three validation rules. The port/adapter split doubles the files needed to trace a request and buys nothing, because nothing ever varies across the port.

## Event-driven (pub/sub, choreography)

**Pressure:** Producers and consumers need to evolve, deploy, and scale independently, and the affected data can tolerate eventual consistency (the consumer doesn't need to know synchronously whether/how the producer's event was handled).

**Cost:** Debugging a causal chain across services becomes materially harder — a single user-visible outcome may now be the result of three services reacting to two events in a particular order. Ordering guarantees, idempotent consumers, and dead-letter/replay handling become permanent design constraints, not incidental details.

**Don't use when:** The caller needs a synchronous confirmation that the operation succeeded (e.g., "was the payment authorized") — publishing an event and hoping a downstream service eventually reacts is a request/response problem wearing event clothing, and it pushes the "did this actually work" question onto the caller with no good way to answer it.

**Looked right but wasn't:** A checkout flow publishes an "OrderPlaced" event and returns 200 immediately, while a downstream service asynchronously decides whether payment actually succeeds. The user is told their order succeeded before anyone has verified payment — the event-driven shape was applied to a case that needed a synchronous answer.

## Microservices vs. modular monolith

**Pressure for microservices:** A *demonstrated* need for independent deployment cadence (this team ships daily, that one ships quarterly, and coupling their releases blocks both), independent scaling (one subdomain needs 50x the capacity of the rest), or independent team ownership of a genuinely separable bounded context.

**Cost:** Every service boundary adds a network hop, a new failure mode, a deployment pipeline, an observability surface, and a data-consistency problem that didn't exist inside a single process/transaction. These costs are fixed per service, not proportional to the service's complexity — a trivial service costs almost as much to operate as a substantial one.

**Don't use when:** The team is small, the domain boundaries aren't yet stable (they're still being discovered), or the split is justified by "microservices are the modern default" rather than a concrete pressure above. This is the single most common architecture-level over-engineering mistake: paying the full operational cost of service separation before any of its benefits are needed, producing a *distributed monolith* — services that must still deploy together, share a database, or call each other synchronously in tight loops, meaning all the coordination tax of a monolith plus all the failure modes of a distributed system.

**Default recommendation:** Start with a modular monolith — one deployable unit, one datastore, strong *internal* module boundaries enforced the same way `codebase-design` enforces module seams. Extract a module into its own service only when a concrete scaling, ownership, or deployment-cadence pressure appears for that specific module, not preemptively for the whole system.

**Looked right but wasn't:** A five-person team splits a new product into twelve microservices at kickoff, "so we can scale each part independently later." Eight months in, every deploy still requires coordinating six of the twelve services because the bounded contexts were never actually separable, and the team spends more time debugging cross-service auth and network flakiness than building the product.

## CQRS (Command Query Responsibility Segregation)

**Pressure:** The read and write models have genuinely different shapes, load profiles, or consistency requirements — e.g., writes are normalized and low-volume, reads are highly denormalized, high-volume, and can tolerate slight staleness (a reporting dashboard vs. the transactional write path).

**Cost:** Two models (or a model plus a projection) that must be kept in sync, or a design that explicitly accepts staleness between them. More moving parts, harder end-to-end reasoning ("which model has the authoritative value right now"), and a synchronization mechanism that itself needs failure-mode design (Section 5).

**Don't use when:** The read and write shapes are already the same, or the perceived asymmetry is hypothetical rather than measured. This is the most over-applied pattern on this list — CQRS is frequently adopted for its architectural elegance rather than a demonstrated read/write asymmetry, adding real complexity for a problem that doesn't exist yet.

## Event sourcing

**Pressure:** A real, stated requirement for full audit trail, point-in-time replay, or temporal queries ("what did this look like as of last Tuesday") that a snapshot-plus-audit-log can't satisfy as cleanly.

**Cost:** Every consumer/read-model must be derivable by replaying the event log, which means the event schema is a permanent, versioned contract — evolving it without breaking historical replay is a standing engineering tax for the life of the system.

**Don't use when:** The actual requirement is "auditability," which a much simpler append-only audit log or table (record what changed, when, by whom) satisfies without requiring the entire system's state to be derived from event replay. Reach for full event sourcing only when replay/point-in-time reconstruction is itself the stated requirement, not merely "having a history."

## Pipeline / pipes-and-filters

**Pressure:** Work is a linear sequence of independent transform stages that don't need to share complex mutable state — ETL jobs, request middleware chains, build/compilation pipelines.

**Cost:** Stages couple to a shared message/data shape passed between them, and backpressure (what happens when a downstream stage is slower than upstream) has to be designed explicitly or the pipeline becomes an unbounded queue in disguise.

**Don't use when:** Stages need complex cross-stage state or need to jump around non-linearly — that's not a pipeline, it's a shared-state system that's being forced into a linear shape it doesn't fit.

## Serverless / FaaS

**Pressure:** Workload is bursty or purely event-triggered, and the cost of provisioning/paying for idle always-on capacity outweighs cold-start latency and vendor-specific constraints.

**Cost:** Cold-start latency, execution-time and resource limits, harder local testing and debugging, and glue code that's often vendor-specific (harder to migrate later).

**Don't use when:** The workload is steady-state and latency-sensitive — a small always-on service is frequently cheaper *and* simpler to reason about than the FaaS glue (queues, event triggers, cold-start mitigation) needed to make serverless behave like an always-on service anyway.
