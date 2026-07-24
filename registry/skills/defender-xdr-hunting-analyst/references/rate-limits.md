# Rate Limits, Query Cost, and Failure Handling

Use this reference before multi-query investigations. It separates current Microsoft Graph behavior, legacy Defender API numbers, and the local MCP implementation. Numeric limits can change; link back to the official source when reporting a limit.

## Table of contents

1. [Limit distinctions](#limit-distinctions)
2. [Preflight ledger](#preflight-ledger)
3. [Execution policy](#execution-policy)
4. [Failure policy](#failure-policy)
5. [Sources](#sources)

## Limit distinctions

| Surface | Verified guidance | How to use it |
|---|---|---|
| Graph `POST /security/runHuntingQuery` | The operation page documents `Timespan` examples but does not publish a dedicated hard row, timeout, lookback, or per-minute quota. Normal Graph throttling applies. | Bound queries for safety anyway. Do not claim that legacy numbers are Graph contractual limits. |
| Defender portal Advanced Hunting | Microsoft documents 30-day Defender data, up to 100,000 rows, 64 MB result size, 10-minute timeout, and tenant CPU quotas for manual hunting. | Portal limits are useful cost signals, not proof of Graph API limits. |
| Legacy Defender XDR hunting API | The older API page documents 30-day range, 100,000 rows, about 3-minute timeout, and at least 45 calls/minute per tenant, with tenant-specific CPU quotas. | Use only when explaining legacy guidance or a local implementation's inherited text. |
| Graph security alerts | Microsoft Graph throttling limits list `alert` operations at 150 requests/minute per app per tenant. | Keep alert enumeration narrow and page deliberately. Incidents and hunting still have dynamic/global Graph limits. |
| Local Defender MCP | `defender_advanced_hunting_run` advertises 30-day, 100,000-row, and about three-minute limits, but source inspection shows a 120-second HTTP client timeout, no local enforcement of the declared lookback/row cap, no Retry-After handling, one-page OData calls, and dropped headers. | Treat the local MCP as a constrained, lossy adapter. Keep a ledger and stop on throttling. |

Official references:

- [Graph throttling](https://learn.microsoft.com/en-us/graph/throttling)
- [Graph service-specific throttling limits](https://learn.microsoft.com/en-us/graph/throttling-limits)
- [Graph `runHuntingQuery`](https://learn.microsoft.com/en-us/graph/api/security-security-runhuntingquery?view=graph-rest-1.0)
- [Advanced Hunting overview](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-overview)
- [Legacy Advanced Hunting API](https://learn.microsoft.com/en-us/defender-xdr/api-advanced-hunting)
- [Graph alerts v2](https://learn.microsoft.com/en-us/graph/api/security-list-alerts_v2?view=graph-rest-1.0)
- [Graph incidents](https://learn.microsoft.com/en-us/graph/api/security-list-incidents?view=graph-rest-1.0)

## Preflight ledger

Maintain this in working memory and include a compact version in the report:

```text
surface: Graph hunting | Graph alerts/incidents | Endpoint API
calls_started: 0
calls_completed: 0
in_flight: 0
last_status: none
retry_after_seen: none
query_cost: low | medium | high
expected_rows: unknown
stop_condition: <what is enough evidence>
```

Before each call, answer:

1. What hypothesis does this call test?
2. Can an existing result or entity tool answer it without another hunt?
3. Is the time range explicit and as small as evidence permits?
4. Are filters pushed before joins or parsing?
5. Are only necessary columns projected?
6. Is the result capped or summarized?
7. What result would make the call unnecessary?

## Execution policy

- Keep at most one Advanced Hunting call in flight. The quota is shared across tenant activity, not just this conversation.
- Start with `take 1`, `count`, or a small `summarize`; do not begin with `union *`, unbounded `search`, or a full-table projection.
- Use `project` before joins and apply a time filter to both join inputs.
- Use a bounded detail query, generally `take 100` or `take 200`, then expand only if a concrete stop condition requires it.
- Combine compatible checks in one selective query only when doing so reduces repeated scans. Do not create a giant cross-domain query that is hard to debug or expensive to execute.
- Page alert, incident, and endpoint list calls manually. Stop when the investigation objective is met, not when an arbitrary page count is reached.
- After every response, record status, row count, whether the response was partial, and any next link or truncation.
- Never assume `P90D` or another accepted `timespan` proves that 90 days of Defender data exists. Retention and data source must be verified separately.

## Failure policy

### HTTP 429 or quota message

1. Stop further query fan-out and preserve the completed evidence.
2. If the tool exposes `Retry-After`, wait at least that many seconds, add small jitter, and retry the same request at most once after reducing cost where possible.
3. If the local MCP hides `Retry-After`, do not fabricate a reset duration and do not immediately repeat the request. Record that the adapter dropped the header, narrow the query or defer the remaining work.
4. Do not infer from the local error text that every Graph resource resets in 15 minutes. The local message is not a universal Graph contract.
5. If the second attempt is throttled, stop and report the uncompleted hypotheses.

### HTTP 400, schema, or permission failure

Classify the error before retrying:

- Unknown table or column: consult `schema-map.md`, use the current table name, and run a minimal corrected query.
- Permission or product coverage: do not retry unchanged; mark the data unavailable and state the required permission/product.
- Invalid time or KQL syntax: fix the query and preserve the failed query in the ledger.

### HTTP 503, 504, or local timeout

Reduce the time range, project fewer columns, move selective filters earlier, remove expensive parsing, and split the pivot. Retry once only. If the second attempt fails, report a coverage gap rather than widening the query.

### HTTP 206 or warning metadata

Microsoft Graph Security can return partial content with provider details in `Warning` headers. Treat the response as incomplete. The inspected MCP's shared helper accepts HTTP 200 and POST 201 but not 206, and it may hide these headers. If a partial response appears as a generic error, record that limitation and avoid claiming complete provider coverage.

## Sources

Microsoft Graph says throttled requests return `429 Too Many Requests` and a `Retry-After` header. When absent, use exponential backoff; immediate retries can continue to count against usage. Graph service limits are subject to change and multiple limits can apply simultaneously.

The local implementation inspected for this skill:

- uses a 120-second shared HTTP timeout;
- does not retry or inspect `Retry-After`;
- drops response headers and detailed bodies in tool errors;
- makes one OData page per call;
- advertises legacy-derived Advanced Hunting limits without enforcing all of them.

These facts justify the conservative ledger policy but must not be presented as Microsoft API guarantees.
