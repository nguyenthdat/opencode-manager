# Defender MCP Contract

This reference describes the local `microsoft-defender-mcp-server` contract inspected on 2026-07-24. OpenCode may expose the server with a namespace prefix, so match the suffix of a tool name rather than assuming one flattened name. Do not invent parameters: inspect the live tool schema when the installed server differs.

## Table of contents

1. [Prerequisites](#prerequisites)
2. [Analysis tools](#analysis-tools)
3. [Input and pagination](#input-and-pagination)
4. [Safety boundaries](#safety-boundaries)
5. [Known implementation caveats](#known-implementation-caveats)

## Prerequisites

The inspected server uses Microsoft Graph and Defender for Endpoint OAuth scopes. Its documented environment variables are `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET`. The application must have at least `ThreatHunting.Read.All` for hunting and the permissions required by the endpoint APIs. A missing permission is an evidence gap, not evidence of absence.

The server is configured in some SecOps projects as:

```jsonc
"microsoft.defender": {
  "type": "local",
  "command": ["microsoft-defender-mcp-server"]
}
```

This skill does not edit MCP configuration. Confirm that the actual session exposes the server before starting an investigation.

## Analysis tools

### Advanced Hunting

`defender_advanced_hunting_run`

Input:

```json
{
  "query": "<read-only KQL>",
  "timespan": "P2D"
}
```

The local schema defaults `timespan` to `P30D` and documents a 30-day lookback, 100,000-row result limit, and approximately three-minute execution limit. The source does not enforce the declared lookback or row limit, and the shared HTTP client timeout is 120 seconds. Treat these as local implementation facts and guardrails, not as a current Graph API contract. See `rate-limits.md`.

The server validates the query as non-empty, at most 128 KB, and rejects obvious mutation/control keywords. It is still the analyst's responsibility to use read-only KQL and to bound cost.

### XDR alerts and incidents

- `defender_xdr_incident_get`: `incident_id`, optional `expand` such as `alerts`.
- `defender_xdr_incident_list`: `top`, `skip`, optional `filter`, `select`, `expand`, and `search` fields in the generic OData input, although only the relevant endpoint features should be used.
- `defender_xdr_alert_get`: `alert_id`.
- `defender_xdr_alert_list`: `top`, `skip`, optional `filter`, `select`, `expand`, and `count` fields as exposed by the live schema.

The XDR tools call Microsoft Graph `security/alerts_v2` and `security/incidents`. Use alert or incident retrieval to seed evidence before querying broad telemetry.

### Endpoint enrichment

The inspected server exposes read-only tools for:

- Devices: `defender_endpoint_machine_list`, `defender_endpoint_machine_get`, `defender_endpoint_machine_logged_on_users`, `defender_endpoint_machine_find_by_tag`, and machine software/recommendation tools.
- Entity pivots: `defender_endpoint_file_get`, `defender_endpoint_file_statistics`, `defender_endpoint_file_related_machines`, `defender_endpoint_file_related_alerts`, `defender_endpoint_ip_statistics`, `defender_endpoint_ip_related_alerts`, `defender_endpoint_domain_statistics`, `defender_endpoint_domain_related_machines`, `defender_endpoint_domain_related_alerts`, `defender_endpoint_user_related_alerts`, and `defender_endpoint_user_related_machines`.
- Endpoint alerts: `defender_endpoint_alert_list` and `defender_endpoint_alert_get`.
- Read-only posture context: software, vulnerability, recommendation, exposure-score, remediation-task, and machine-action status tools.

Use these for targeted enrichment and prevalence. Use Advanced Hunting for causal timelines and cross-product correlation.

## Input and pagination

For Graph/TI OData list inputs, the local validator defaults `top` to 50, accepts `top` up to 1,000, and accepts `skip` up to 100,000. For Defender Endpoint list inputs, `top` may be up to 10,000. These are local validator ceilings, not a guarantee that the upstream resource accepts every value.

The local client fetches one page and does not automatically follow `@odata.nextLink`. Therefore:

1. Use a small `top` for triage and a selective `$filter`.
2. Check the returned object for `@odata.nextLink` or an equivalent next-link field.
3. Page deliberately only while the ledger's stop condition remains unmet.
4. Record the page range and any unvisited next link in the report.

Do not request a large page merely to avoid thinking about pagination. Large responses increase latency, context cost, and the chance of throttling.

## Safety boundaries

The following tools are not analysis tools and may have side effects. Their MCP annotations are not an authorization decision, so never call them during a read-only investigation:

- `defender_library_file_upload`
- `defender_endpoint_live_response_run`

Live Response is startup-gated by `DEFENDER_ENABLE_LIVE_RESPONSE=true`, but the gate is not a substitute for user authorization. If the user later requests response action, stop the analysis flow and obtain explicit scope, target, command, and confirmation.

## Known implementation caveats

- The local HTTP client uses a 120-second timeout.
- Error handling drops response headers and detailed response bodies. The analyst may not see `Retry-After` or Graph `Warning` metadata.
- The local 429 message claims an Advanced Hunting quota reset every 15 minutes. Do not treat that message as a universal Graph or incident API rule.
- For the shared request helper, HTTP 200 is accepted for normal calls and POST 201 is accepted for created resources. A Graph Security 206 partial response may be surfaced as an error.
- The server has no effective-schema discovery tool. Do not assume that a documented table is visible to the current identity; validate only the tables needed for the hypothesis.
