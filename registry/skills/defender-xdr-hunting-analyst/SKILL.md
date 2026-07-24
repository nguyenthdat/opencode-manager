---
name: defender-xdr-hunting-analyst
description: "Analyze Microsoft Defender XDR Advanced Hunting data and alerts/incidents with the Defender MCP. Use for KQL hunting, endpoint/process/network investigations, Defender for Office 365 email and URL-click investigations, Entra identity and service-principal sign-ins, CloudAppEvents, cross-domain correlation, alert triage, incident scoping, IOC pivots, and follow-up or rerun requests. Use this instead of generic KQL guidance when Microsoft Defender telemetry or the Defender MCP is involved; do not use it for Sentinel-only analysis with no Defender data."
compatibility: opencode
metadata:
  domain: security-operations
  platform: microsoft-defender-xdr
  workflow: hypothesis-driven-incident-analysis
  data_access: read-only-analysis
---

# Microsoft Defender XDR Hunting Analyst

Perform evidence-led investigations over Microsoft Defender XDR using the Defender MCP. Start from the incident or alert and its entities, form competing hypotheses, run the smallest useful KQL queries, correlate only on defensible keys, and report both confirmed evidence and coverage gaps. The goal is a reproducible investigation, not a pile of loosely related rows.

## When to use

Use this skill when the request mentions Microsoft Defender, Defender XDR, Advanced Hunting, KQL hunting, Defender for Endpoint, Defender for Office 365, Defender for Identity, Defender for Cloud Apps, alerts, incidents, device timelines, phishing, Entra sign-ins, service principals, or cross-domain IOC correlation.

Do not silently turn an analysis request into containment. Live Response and other response actions are outside this skill's default read-only scope and require a separate explicit request and confirmation.

## Workflow

### 1. Establish scope and capability

Record the investigation objective, incident or alert ID, seed IOC/entity, tenant or business context, UTC time window, and requested outcome. If the time window is missing, derive it from the alert or incident timestamps with a narrow buffer and state the assumption.

Discover the configured Defender MCP namespace by matching tool suffixes. Prefer these verified local contract names when present:

- `defender_xdr_incident_get` with `expand=alerts` and `defender_xdr_alert_get` for XDR context.
- `defender_xdr_incident_list` and `defender_xdr_alert_list` for narrow OData discovery.
- `defender_advanced_hunting_run` with `query` and `timespan` for KQL.
- Endpoint enrichment tools such as `defender_endpoint_machine_get`, `defender_endpoint_file_get`, `defender_endpoint_domain_statistics`, `defender_endpoint_ip_statistics`, and related-alert tools.

Read [references/mcp-contract.md](references/mcp-contract.md) before using unfamiliar arguments. If the MCP is unavailable, do not invent results: provide the ready-to-run KQL plan and identify the missing evidence.

### 2. Build an evidence graph before hunting

Fetch the incident or alert first when an ID exists. Extract:

- Alert IDs, titles, severity, service source, detection source, categories, and timestamps.
- Evidence entities: devices, accounts, files and hashes, IPs, domains, URLs, email message IDs, application IDs, and cloud objects.
- The first-seen, last-seen, and alert-ingestion boundaries.

Create a small entity graph and a hypothesis table before expanding scope:

| Hypothesis | Supporting signal | Disconfirming check | Status |
|---|---|---|---|
| H1: malicious activity | direct telemetry or consistent attack chain | expected benign parent, sanctioned admin activity, or absent execution | open |
| H2: benign or expected activity | known owner, signed tool, change window, normal prevalence | unexplained persistence, credential abuse, or cross-domain spread | open |
| H3: related but separate activity | shared IOC only | same immutable entity plus causal timing and matching behavior | open |

Do not treat a shared IP, display name, short account name, or device name as proof of causality. Prefer the join keys in [references/schema-map.md](references/schema-map.md).

### 3. Plan queries as a bounded sequence

Create a query ledger before the first hunting call. Each row needs: query ID, hypothesis, table(s), exact time bound, pivot, expected row cap, cost (`low`, `medium`, or `high`), and stop condition. Use one hunting request at a time; parallel fan-out can consume the tenant-wide quota shared by other playbooks and analyst sessions.

Use this sequence unless evidence justifies a different one:

1. **Context:** incident/alert metadata and evidence, using read-only alert/incident tools.
2. **Availability:** one small, selective query against the required table with `take 1` or a bounded count. Do not probe every table.
3. **Baseline:** count or summarize the relevant entity in the same time window to distinguish rare from merely noisy.
4. **Detail:** retrieve a narrow timeline with an explicit `project`, early filters, and a small `take` limit.
5. **Correlation:** pivot to the next domain using an immutable key and enforce a time filter on both sides of every join.
6. **Disconfirmation:** run at least one query that could falsify the leading hypothesis.
7. **Blast radius:** expand to related users, devices, messages, applications, or service principals only when the evidence supports it.

Read [references/kql-patterns.md](references/kql-patterns.md) for safe query shapes and [references/rate-limits.md](references/rate-limits.md) before a multi-query investigation. Keep every executed query in the final report exactly as run.

### 4. Select domain playbooks deliberately

Load only the relevant section of [references/domain-playbooks.md](references/domain-playbooks.md):

- Endpoint: process lineage, files, network, logons, persistence, and device state.
- Office 365 and collaboration: email/Teams messages, attachments or files, URLs, Safe Links clicks, campaigns, sender/recipient, and post-delivery activity.
- Identity: Entra user sign-ins, service principals, managed identities, on-prem identity events, directory changes, and query activity, with the source boundary stated for each.
- Cloud apps: SaaS activity, OAuth applications, object access, IP and anomaly context.
- Cross-domain: email or identity seed to endpoint, cloud app, and incident evidence without confusing correlation with causation.

Use current `EntraIdSignInEvents` and `EntraIdSpnSignInEvents` for new work and state their Entra ID P2/product requirement when relevant. Treat `AADSignInEventsBeta` and `AADSpnSignInEventsBeta` as legacy compatibility references only. Treat `SigninLogs` and `AuditLogs` as Sentinel/Log Analytics tables that require an available connected workspace, not as guaranteed Defender-native data.

### 5. Reason over the result set

For each material finding, state:

- **Observed:** what the returned row or alert directly says, including timestamp and entity IDs.
- **Inferred:** the behavior or attack-chain interpretation, with the join and temporal reasoning used.
- **Alternative:** the strongest benign or unrelated explanation and whether it was tested.
- **Confidence:** `high`, `medium`, or `low`, based on independent corroboration rather than row count.
- **Gap:** missing product, permission, retention, hash, table, or MCP capability that could change the conclusion.

Prefer a coherent causal timeline over a large IOC list. Flag late-arriving entity tables, sparse hashes, recycled process IDs, duplicate alerts, partial responses, and results truncated by `take`, page size, timeout, or quota.

### 6. Stop safely and handle failures

Apply the rate-limit and error policy in [references/rate-limits.md](references/rate-limits.md). In particular:

- On `429`, stop the query fan-out. Honor a visible `Retry-After`; if the local MCP hides it, do not guess a reset time or immediately hammer the endpoint.
- On `400` or a schema/permission error, fix the table, column, time range, or authorization before retrying. Never retry the same invalid query.
- On timeout or `503/504`, narrow the time window, reduce columns, split the pivot, and retry at most once.
- On a partial response or warning, mark the evidence incomplete and preserve the warning if the tool exposes it.

## Output format

Use this report structure unless the user requests another format:

````markdown
# Defender XDR Investigation: <short title>

## Verdict
- Classification: Malicious | Suspicious | Benign | Inconclusive
- Confidence: High | Medium | Low
- Scope: <tenant/context, UTC window, incident/alert/IOC>
- One-sentence rationale: <direct evidence and causal link>

## Executive Summary
<What happened, what is affected, and what remains unknown.>

## Evidence Timeline
| UTC time | Domain | Entity | Observed event | Source | Confidence |
|---|---|---|---|---|---|

## Findings and Hypotheses
<For each finding: Observed, Inferred, Alternative, Confidence, Gap.>

## Impact and Scope
- Confirmed entities:
- Probable entities:
- Searched but not observed:
- Coverage limitations:

## Queries Executed
### Q1: <purpose>
```kusto
<exact KQL>
```
Result summary: <rows, ordering, truncation, errors, and time>

## Rate-Limit Ledger
| Query/tool | Surface | Result size | Outcome | Retry/backoff |
|---|---|---:|---|---|

## Recommended Next Steps
<Read-only validation first; separate response actions and ask for confirmation before any action.>
````

Never claim that a table, alert, or IOC was checked when the MCP call failed, returned no accessible schema, or was not executed. Distinguish `no matching rows` from `query failed` and `data unavailable`.

## Verification

Before finalizing, confirm that:

- Every query has an explicit UTC/time filter, selected columns, a bounded result strategy, and a named hypothesis.
- Every join uses a defensible key and time constraint; process joins retain `DeviceId` and unique process IDs.
- The current table names and important columns were checked against [references/schema-map.md](references/schema-map.md) and its official Microsoft links.
- The report includes failed calls, throttling, partial results, pagination, retention, permissions, and product-coverage gaps.
- No live response, upload, containment, or remediation tool was invoked for a read-only analysis.

## References

- [references/mcp-contract.md](references/mcp-contract.md) - verified Defender MCP tool suffixes, arguments, and local implementation caveats.
- [references/schema-map.md](references/schema-map.md) - table catalog, columns, joins, retention, and official Microsoft schema links.
- [references/rate-limits.md](references/rate-limits.md) - Graph throttling, legacy quota distinctions, local MCP limits, and the query ledger policy.
- [references/kql-patterns.md](references/kql-patterns.md) - bounded KQL templates and performance rules.
- [references/domain-playbooks.md](references/domain-playbooks.md) - endpoint, Office 365, identity, cloud app, and cross-domain investigation flows.
