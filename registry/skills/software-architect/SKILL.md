---
name: software-architect
description: "Use when making or reviewing a system/service-level architecture decision: choosing an architecture style, recording an ADR, evaluating build-vs-buy, defining service/data boundaries, or designing failure-mode/resilience strategy across services. Do not use for in-module interface design (see `codebase-design`) or code-level GoF pattern selection (see `design-patterns`)."
compatibility: opencode
metadata:
  domain: architecture
  audience: software-engineer
  workflow: architecture-review
---

# Software Architect

System/service-level architecture: the decisions that shape what talks to what, where data lives, where a network hop or a process boundary sits, and what happens when a dependency fails. These decisions are expensive to reverse because they're load-bearing for teams, deployments, and data — not because the code is complex.

## Scope boundary

Architecture work happens at three distinct zoom levels. Confusing them produces either over-engineered modules or under-designed systems.

- **This skill (system/service level):** how many deployable units exist, what boundary each owns, how they integrate, which quality attributes were traded against which, and what's recorded so the decision survives the person who made it. Read this skill when a decision changes the shape of the system, not the shape of a file.
- **`codebase-design` (module/interface level):** given a module or service already exists, how deep is its interface, where does its seam sit, is it testable. Load that skill once a container/component from this skill's decomposition needs its internals designed.
- **`design-patterns` (code level):** given a module's interior needs a construction, polymorphism, or state-transition mechanism, which idiomatic construct or GoF pattern expresses it. Load that skill once you're inside a single module writing code.

A concrete tell for which level you're in: if the answer changes which team owns what, which service can deploy independently, or where a network call exists, it's this skill. If the answer only changes what's inside one module's file boundary, hand off downward. Resilience is the sharpest case of this split: this skill decides **where** a timeout/retry/circuit-breaker/bulkhead boundary needs to exist in the system (which call is unreliable enough, and consequential enough, to need one); `design-patterns` decides **how** to implement that specific pattern in code once the boundary is chosen. Don't re-litigate the coding mechanics here, and don't let the code-level skill silently decide system topology.

## 1. Quality-attribute elicitation and trade-offs

Don't recite the full "-ilities" checklist (availability, scalability, latency/throughput, consistency, security, maintainability, cost, operability, testability) at every decision — that produces generic architecture theater. Instead, elicit which 2-4 attributes are actually under pressure for *this* request, from the request itself:

- What does the request explicitly ask for (an SLA number, a traffic figure, a compliance requirement, a deadline)? Those are given attributes, not guesses.
- What's implied by the domain (payments implies consistency and auditability; a public read API implies latency and availability; an internal batch job usually doesn't need either)?
- What did the requester *not* mention that a wrong default would break (e.g., they didn't say "must survive a region outage," but if the system already runs multi-region, silently dropping that guarantee is a real regression, not a neutral default)?

Once the 2-4 real attributes are named, treat the rest as constraints to keep merely adequate, not optimize. **You cannot maximize consistency, availability, and latency simultaneously across a network partition, and you cannot maximize maintainability and raw throughput inside the same design for free.** Every style choice in Section 2 is a trade among these. Record the trade explicitly:

```text
Attribute prioritized: <e.g. availability under partition>
Attribute knowingly sacrificed: <e.g. strong consistency>
Why this direction: <the concrete pressure that forced the choice>
Who is affected by the sacrifice: <caller, team, data class>
```

A design that lists quality attributes but never says which one lost is not a trade-off analysis — it's a wish list. If nothing was sacrificed, the decision probably wasn't architecturally significant enough for this level of ceremony (see Section 3).

## 2. Architecture styles decision guide

Pick a style because a named pressure from Section 1 demands it, not because it's the current default or the most interesting one to build. The most common failure mode in this space is **microservices-by-default**: splitting a system into network-separated services before there's a demonstrated scaling, team-ownership, or independent-deployment need, producing a *distributed monolith* — all the coordination cost of services, all the coupling of a monolith, none of the benefit of either. The second most common is **speculative CQRS/event sourcing**: adopting a full command/query split or an event-sourced store because it's architecturally elegant, not because a demonstrated read/write asymmetry or audit requirement exists.

Full per-style pressure/cost/anti-pattern detail lives in [references/architecture-styles.md](references/architecture-styles.md). Summary:

| Style | Adopt when | Costs | Don't adopt when |
|---|---|---|---|
| Layered / n-tier | Team and domain are small enough that one shared model is still legible | Layers tend to leak; lower layers get pulled upward under pressure | The domain has genuinely independent subdomains — layering then hides the seams instead of expressing them |
| Hexagonal / ports-and-adapters | Core domain logic must stay swappable/testable against multiple real or fake externals (DB, queue, third-party API) | Extra indirection and interface ceremony for simple CRUD | The "core" has no real domain logic to protect — it's a thin pass-through to one datastore |
| Event-driven (pub/sub, choreography) | Producers and consumers must evolve and scale independently, and eventual consistency is acceptable for the affected data | Debugging a causal chain across services is hard; ordering and idempotency become permanent design constraints | You need synchronous confirmation ("did the write succeed") — that's a request/response problem wearing event clothing |
| Microservices | A demonstrated need exists for independent deployment cadence, independent scaling, or independent team ownership of a bounded context | Operational overhead (network, observability, deployment pipelines) multiplies per service; data consistency crosses process boundaries | The team is small, the domain isn't yet stable, or the split is justified only by "it's the modern way" — prefer a modular monolith and extract later when a real seam appears |
| Modular monolith | Default starting point: strong internal module boundaries, one deployable, one datastore | Requires real discipline to keep modules from reaching into each other's tables/internals | The org has already outgrown single-deployment cadence for the specific modules in question |
| CQRS | Read and write models have genuinely different shapes, load profiles, or consistency needs, and the duplication cost is worth it | Two models to keep in sync (or accept staleness for), more moving parts, harder to reason about end-to-end | The read and write shapes are already the same — this is the single most over-applied pattern in this list |
| Event sourcing | The audit/replay/temporal-query requirement is real and stated, not hypothetical | Every consumer must be rebuilt from the event log; schema evolution of events is a permanent tax | You want event sourcing "for auditability" but a simple append-only audit log/table would satisfy the same requirement at a fraction of the cost |
| Pipeline / pipes-and-filters | Work is a linear sequence of independent transform stages (ETL, request middleware, build systems) | Stage coupling to a shared message shape; backpressure between stages must be designed explicitly | Stages have complex cross-stage state — that's not a pipeline, it's a shared-state system pretending to be one |
| Serverless / FaaS | Workload is bursty/event-triggered and the cost of idle capacity outweighs cold-start and vendor-lock-in costs | Cold starts, execution-time limits, harder local testing/debugging, vendor-specific glue | Workload is steady-state and latency-sensitive — the always-on cost of a small service is often cheaper and simpler than FaaS glue |

When two styles both look defensible, that's a signal for an ADR (Section 3), not a coin flip — the deciding factor is almost always which quality attribute (Section 1) you already committed to.

## 3. ADR: what warrants one, and the format

Not every decision needs a recorded ADR — most implementation choices belong in code comments or the architecture artifact's prose. Write an ADR when the decision meets **any** of these:

- **Expensive or irreversible to change later** (a datastore choice, a service boundary, a synchronous-vs-async integration contract with an external party).
- **Cross-cutting** — it constrains code that multiple modules, services, or teams will write, not just the one place it's first applied.
- **Affects more than one team or module's roadmap** — someone other than the author will need to know this decision was made and why.
- **Introduces a new external dependency or infrastructure piece** — a new datastore, message broker, cloud service, or third-party API the system didn't previously depend on.

Skip the ADR ceremony for a decision that's easily changed, local to one module, and doesn't add a new moving part — e.g., "which internal helper function to use" or "how to name this table column" belong in code, not in an ADR.

Minimal required fields: **Context, Decision, Status, Consequences, Alternatives Considered.** Full template, worked example, and status-lifecycle guidance are in [references/adr-template.md](references/adr-template.md). Inline skeleton:

```markdown
# ADR-NNNN: <short decision title>

## Status
Proposed | Accepted | Superseded by ADR-XXXX | Deprecated

## Context
<the forces at play: constraints, quality attributes under pressure, current state>

## Decision
<what was decided, stated as a single unambiguous sentence, then elaborated>

## Alternatives Considered
- <alternative 1> — rejected because <reason>
- <alternative 2> — rejected because <reason>

## Consequences
<what becomes easier, what becomes harder, what new risk or operational burden this introduces>
```

## 4. System decomposition (lightweight, C4-inspired)

Don't require formal C4 diagrams for every task — most tasks only need one or two of these levels described in prose inside the architecture artifact. Go one level deeper only when the current level leaves a real ambiguity about who talks to whom or who owns what data.

- **Context:** who/what is outside the system and why they touch it — users, external systems, other teams' services. Write this when the task changes what the system integrates with, or when the requester's framing suggests they don't already share this picture. Skip it for a change entirely inside one already-understood service.
- **Containers/services:** the independently deployable/runnable units (a service, a database, a queue, a CLI, a mobile app) and the protocol between them. This is the level nearly every architecturally-significant task needs at least a sentence of: what new container, if any, is introduced, and what talks to it synchronously vs. asynchronously.
- **Components:** the major internal groupings inside one container (e.g., "the order service has an API layer, a domain layer, and a repository layer"). Go this deep only when the task is specifically about restructuring one container's internal shape — and at that point, hand off to `codebase-design` for the actual interface/seam work; this skill only needs to name the components and their responsibilities, not design their interfaces.

A useful test for "did I go deep enough": can a reader tell, from what you wrote, which team or service owns the next line of code that needs to change? If not, go one level deeper. A second test for "did I go too deep": are you now describing function signatures or class names? That's `codebase-design`/`design-patterns` territory — stop and hand off.

## 5. Dependency and integration strategy

**Build vs. buy vs. adopt-open-source.** Default order of preference, cheapest-to-reverse first: adopt an existing well-maintained OSS/managed component, then buy a vendor solution, then build. Building is justified when the capability is a genuine differentiator for the system (the thing the system exists to do well), or when no adequate existing option meets a hard constraint (data residency, license, latency, cost at scale). Buying/adopting is justified everywhere else — undifferentiated infrastructure capability (auth, queues, search, payments processing) is rarely worth building from scratch. Record which of the three was chosen and why whenever a new external dependency or infrastructure piece enters the system (see Section 7 — this is a BLOCKER-eligible gap if skipped).

**API/contract design between services.** Every synchronous or asynchronous integration between two independently deployable units is a contract, and contracts need explicit versioning and backward-compatibility policy from the start — not "we'll figure out versioning when we need it." At minimum, decide and record: how a breaking change gets rolled out (parallel versions, expand-contract migration), what backward-compatibility guarantee the contract makes today, and whether contract tests exist or are planned to catch drift between provider and consumer before deployment rather than in production.

**Synchronous vs. asynchronous integration.** Choose synchronous (request/response) when the caller needs the result to proceed, and the callee's availability is acceptable to couple to. Choose asynchronous (event/queue) when the caller doesn't need an immediate answer, when producer and consumer must scale or deploy independently, or when the callee's occasional unavailability shouldn't block the caller. Don't choose async merely because it's fashionable — it converts an easy-to-reason-about failure (the call failed, retry) into a harder one (did the message get processed, and if so, when, and how do I know).

**Data ownership boundaries.** Each piece of data has exactly one owning service, and every other service reaches it through that owner's API or published events — never through direct access to the owner's tables. **Shared-database-as-integration** (two services reading or writing the same tables) is one of the most damaging anti-patterns at this level: it silently recreates a monolith's coupling without any of a monolith's benefits (one deployable, one transaction boundary, one migration path), and it's this skill's most concrete BLOCKER (Section 7). If two services appear to need the same data, that's a signal to either merge them, or have one own the data and expose it, not to point two writers at one table.

**Failure-mode design at the system level.** This is about *where* resilience boundaries need to exist, not how to code them (that's `design-patterns`'s Circuit Breaker/Retry entries). For every new synchronous integration point between independently-failing units, decide explicitly:

- **Timeout:** does this call have a bound, and is it shorter than the caller's own deadline budget?
- **Retry:** is the operation idempotent enough to retry safely, and is there backoff to avoid amplifying load onto a struggling dependency?
- **Circuit breaker:** if the dependency is degraded, should callers stop hammering it and fail fast instead?
- **Bulkhead:** should this dependency's failure be isolated (separate thread/connection pool, separate resource budget) so it can't exhaust resources needed by unrelated calls?
- **Graceful degradation:** is there a reduced-functionality path (cached/stale data, a default, a partial response) that's better than a hard failure for this specific caller?

Not every integration point needs all five — a call to an internal, co-deployed, always-available component may need none of them. The point is to make the decision explicit at each new cross-process boundary, not to silently assume the network never fails.

## 6. Evolutionary architecture

Architecture decisions made today are always made with the least information the system will ever have. Design for the ability to be wrong cheaply, rather than for being right forever:

- **Design for reversibility.** Prefer the decision that's cheaper to undo when two options otherwise satisfy the same quality attributes equally well. A synchronous call behind a well-defined interface is cheaper to later convert to async than a schema that's been directly queried by five other services.
- **Fitness functions / architectural constraints.** For a constraint that matters (a layering rule, a "no service reads another's database," a latency budget, a dependency-direction rule), prefer one that can be checked automatically or repeatedly over time (a lint rule, an architecture test, a CI check) over one that lives only as a sentence in a document someone read once. Note in the ADR/architecture artifact when such a check would materially reduce drift risk, even if wiring the check itself is out of scope for the current task.
- **Avoid premature architecture (system-level YAGNI).** Don't build the microservice split, the event bus, or the multi-region failover for a scale, team size, or availability requirement that doesn't exist yet and isn't stated in the request. Speculative architecture is exactly as costly as speculative code — it just costs more to undo.
- **Strangler-fig migration for existing systems.** When evolving an existing system rather than greenfield, prefer incremental replacement (route an increasing slice of traffic/functionality to the new implementation behind a stable seam, retire the old path once coverage is complete) over a big-bang rewrite. Record the cutover seam, the traffic-routing mechanism, and the rollback path as part of the migration decision — a strangler-fig plan without a rollback path is just a slow big-bang rewrite.

## 7. Review rules

**BLOCKER** — the decision must not stand as-is:

- A decision that's expensive or irreversible to reverse (Section 3 criteria) has no recorded alternative or rejected-alternative reasoning.
- A distributed architecture (microservices, a new network hop, a new independently-deployed service) is introduced without a demonstrated scaling, team-ownership, or independent-deployment need.
- A new external dependency or infrastructure piece is added without an explicit build-vs-buy-vs-adopt evaluation.
- A data-ownership violation: two services read or write the same underlying database/tables (shared-database-as-integration).

**WARNING** — should be fixed, but doesn't necessarily invalidate the design:

- A quality-attribute trade-off was never recorded — the artifact names attributes but never says what was sacrificed for what.
- A new synchronous integration point between independently-failing units has no stated timeout/retry/circuit-breaker/bulkhead/degradation decision (even "none needed, and here's why" is sufficient — silence is not).

Don't block a decision merely because it didn't use an ADR template for a genuinely low-stakes, easily-reversible, single-module choice — over-applying ceremony is its own anti-pattern (Section 3).

## 8. Decision-record template (copy into the output artifact)

For every materially significant architecture decision — not every line of the artifact, but every decision that would qualify for an ADR under Section 3 — copy this block into the architecture output artifact, filled in:

```text
Pressure/Driver: <the concrete requirement or constraint forcing a decision, tied to Section 1's elicited attributes>
Decision: <the style, boundary, dependency, or integration choice made>
Alternatives Considered: <at least one other option, and specifically why it was rejected — not just named>
Quality-Attribute Trade-offs: <attribute(s) prioritized> vs <attribute(s) knowingly sacrificed>, and who/what is affected
Risks/Costs: <operational, financial, or complexity cost this decision introduces>
Reversibility: <cheap | moderate | expensive-to-reverse, and what would have to change to undo it>
Owner/Consequences: <which team/service now owns the consequences of this decision, and what becomes easier or harder as a result>
```

A decision recorded without a filled Alternatives Considered field is not a design decision — it's a preference. This mirrors `design-patterns`'s pattern-decision block; keep the two vocabularies distinct (that record is for a pattern choice inside one module, this one is for a system-shape choice).

## References

- [references/architecture-styles.md](references/architecture-styles.md) — full pressure/cost/anti-pattern detail per architecture style, with worked "when this looked right but wasn't" examples.
- [references/adr-template.md](references/adr-template.md) — complete ADR template, status lifecycle (Proposed/Accepted/Superseded/Deprecated), and a filled worked example.
