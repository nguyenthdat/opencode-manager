# ADR Template and Status Lifecycle

## When to write one

See `SKILL.md` Section 3 for the full criteria. Short version: write an ADR when the decision is expensive/irreversible, cross-cutting, affects more than one team/module, or introduces a new external dependency or infrastructure piece. Skip it for anything easily changed, local to one module, and not adding a new moving part.

## Status lifecycle

- **Proposed** — the decision is drafted and under discussion; not yet acted on. Fine to have open questions in Consequences.
- **Accepted** — the decision is final and the system should be built/changed to match it. This is the normal steady state for most ADRs once implementation starts.
- **Superseded by ADR-XXXX** — a later decision replaced this one. Never delete or silently edit an old ADR to reflect a new decision; supersede it and link forward and backward, so the history of *why* the system changed shape stays legible.
- **Deprecated** — the decision no longer applies (e.g., the component it concerned was retired) but wasn't replaced by a specific newer decision.

Keep superseded/deprecated ADRs in place. The point of an ADR is as much "why did we do this" for future readers as it is "what did we do" — deleting the trail defeats the purpose.

## Full template

```markdown
# ADR-NNNN: <short decision title, phrased as the decision, not the topic>

## Status
Proposed | Accepted | Superseded by ADR-XXXX | Deprecated

## Context
<What forces are at play: the concrete requirement, constraint, or quality attribute
(Section 1 of SKILL.md) under pressure. State the current situation neutrally —
this section should be understandable even to someone who disagrees with the
eventual decision.>

## Decision
<The decision itself, as one unambiguous sentence, then elaborated with enough
detail that an implementer doesn't have to guess. If the decision has multiple
parts (e.g., "use async messaging AND own the schema in service X"), state all
parts.>

## Alternatives Considered
- <Alternative 1> — rejected because <specific reason tied to the Context's
  forces, not a vague "didn't fit">
- <Alternative 2> — rejected because <specific reason>
- (At minimum one alternative. "We only considered one option" is itself worth
  stating explicitly if true, with why no second option was seriously evaluated.)

## Consequences
<What becomes easier as a direct result of this decision. What becomes harder
or riskier. What operational, financial, or team-ownership burden this
introduces. Consequences should include the trade-off framing from Section 1 —
name what was sacrificed, not just what was gained.>
```

## Worked example

```markdown
# ADR-0007: Own order status via published events, not shared database access

## Status
Accepted

## Context
The fulfillment service currently reads order status directly from the orders
service's Postgres database via a read replica. This was fast to build, but
two incidents in the last quarter were caused by fulfillment's read queries
locking rows during orders' peak write traffic, and orders cannot change its
schema without coordinating a migration window with the fulfillment team.
The quality attribute under the most pressure here is maintainability/team
independence — the orders team cannot evolve their schema without a
cross-team migration, and availability — fulfillment's read load is affecting
orders' write path.

## Decision
The orders service will publish an OrderStatusChanged event (via the existing
message broker) whenever an order's status changes. Fulfillment will build
and own a local read model derived from this event stream, and stop querying
orders' database directly. The orders team may change their internal schema
freely as long as the published event contract is preserved or versioned.

## Alternatives Considered
- Keep the read replica but add a rate limit or dedicated replica for
  fulfillment's queries — rejected because it addresses the availability
  symptom but not the underlying coupling: orders still cannot change its
  schema without fulfillment's queries breaking.
- Have fulfillment call a synchronous orders API for status on demand —
  rejected because fulfillment's read pattern requires bulk/aggregate status
  checks that would produce a high-volume, latency-sensitive synchronous
  dependency on orders' availability; the read tolerates eventual consistency
  (minutes-old status is acceptable for fulfillment's workflow), so a
  synchronous dependency would be trading away availability for a
  consistency guarantee fulfillment doesn't need.

## Consequences
Easier: orders can evolve its schema independently; fulfillment's read load
no longer contends with orders' write path; the failure mode of orders being
briefly unavailable no longer blocks fulfillment (it works from its own
local read model).
Harder: fulfillment's read model can lag behind orders' true state by the
event-processing delay (accepted trade-off: consistency sacrificed for
availability and team independence — acceptable because fulfillment's
workflow already tolerates minutes-old status). Orders must now treat the
event schema as a versioned public contract rather than an internal
implementation detail, and fulfillment must handle event delivery failure
(dead-letter, replay) which didn't exist as a concern before.
```
