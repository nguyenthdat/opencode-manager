# Bounded KQL Patterns for Advanced Hunting

Use these as shapes, not copy-paste detections. Replace placeholders, validate table visibility, and run the smallest version first. Every production query should include a time bound and a result stop condition.

## Table of contents

1. [Context and availability](#context-and-availability)
2. [Endpoint](#endpoint)
3. [Office 365](#office-365)
4. [Identity and cloud apps](#identity-and-cloud-apps)
5. [Correlation rules](#correlation-rules)

## Context and availability

Minimal table check:

```kusto
let start = ago(2h);
DeviceProcessEvents
| where Timestamp between (start .. now())
| project Timestamp, DeviceId, DeviceName, FileName, ProcessCommandLine
| take 1
```

Bounded row estimate:

```kusto
let start = ago(24h);
DeviceNetworkEvents
| where Timestamp between (start .. now())
| where DeviceId == "<device-id>"
| summarize rows = count()
```

Use `take 1` to test table/column access. Use `count` to estimate cost, but remember that a count is still a scan. Do not run one availability probe for every table in the schema.

## Endpoint

### Device timeline

```kusto
let start = datetime(<utc-start>);
let end = datetime(<utc-end>);
union
    (DeviceProcessEvents | where Timestamp between (start .. end) | project Timestamp, DeviceId, DeviceName, EventType = "Process", FileName, FolderPath, ProcessCommandLine, ProcessUniqueId, InitiatingProcessUniqueId, AccountUpn),
    (DeviceFileEvents | where Timestamp between (start .. end) | project Timestamp, DeviceId, DeviceName, EventType = "File", FileName, FolderPath, SHA1, SHA256, InitiatingProcessUniqueId, AccountUpn = InitiatingProcessAccountUpn),
    (DeviceNetworkEvents | where Timestamp between (start .. end) | project Timestamp, DeviceId, DeviceName, EventType = "Network", RemoteIP, RemoteUrl, RemotePort, InitiatingProcessUniqueId, InitiatingProcessFileName, InitiatingProcessCommandLine)
| where DeviceId == "<device-id>"
| order by Timestamp asc
| take 200
```

For a first pass, query each table separately if the union produces schema or cost problems. Keep the same time window and device pivot so the results remain comparable.

### Process lineage

```kusto
let start = ago(6h);
let end = now();
let processes = DeviceProcessEvents
| where Timestamp between (start .. end)
| where DeviceId == "<device-id>"
| project Timestamp, DeviceId, FileName, FolderPath, ProcessCommandLine, ProcessUniqueId, InitiatingProcessUniqueId, InitiatingProcessFileName, InitiatingProcessCommandLine, AccountUpn;
processes
| where FileName in~ ("powershell.exe", "pwsh.exe", "cmd.exe", "wscript.exe", "cscript.exe", "rundll32.exe", "mshta.exe")
| order by Timestamp asc
| take 200
```

Use `ProcessUniqueId` and `InitiatingProcessUniqueId` when available. Do not reconstruct a tree from PID alone because process IDs are recycled.

### Network pivot from a process

```kusto
let start = ago(6h);
let end = now();
let suspect = DeviceProcessEvents
| where Timestamp between (start .. end)
| where DeviceId == "<device-id>"
| where SHA1 == "<sha1>" or ProcessCommandLine has "<token>"
| project DeviceId, ProcessUniqueId, ProcessCreationTime;
DeviceNetworkEvents
| where Timestamp between (start .. end)
| where DeviceId == "<device-id>"
| where InitiatingProcessUniqueId in (suspect | project ProcessUniqueId)
| project Timestamp, DeviceId, RemoteIP, RemoteUrl, RemotePort, Protocol, InitiatingProcessUniqueId, InitiatingProcessFileName, InitiatingProcessCommandLine
| order by Timestamp asc
| take 200
```

Prefer `has` for token matching and exact IDs for entity pivots. Use an IOC domain/IP as supporting evidence, not as the only causal link.

## Office 365

### Message to URL and attachment chain

```kusto
let start = ago(7d);
let end = now();
let messages = EmailEvents
| where Timestamp between (start .. end)
| where NetworkMessageId == "<network-message-id>"
| project Timestamp, NetworkMessageId, SenderFromAddress, RecipientEmailAddress, Subject, DeliveryAction, ThreatTypes;
let urls = EmailUrlInfo
| where Timestamp between (start .. end)
| where NetworkMessageId == "<network-message-id>"
| project Timestamp, NetworkMessageId, Url, UrlDomain, UrlLocation, UrlChainId, UrlChainPosition;
let attachments = EmailAttachmentInfo
| where Timestamp between (start .. end)
| where NetworkMessageId == "<network-message-id>"
| project Timestamp, NetworkMessageId, FileName, FileType, SHA256, FileSize, ThreatTypes;
union (messages | extend EvidenceType = "Message"), (urls | extend EvidenceType = "URL"), (attachments | extend EvidenceType = "Attachment")
| order by Timestamp asc
| take 200
```

If the message ID is missing, pivot on a narrow recipient/time/subject window and state the weaker correlation. Do not silently substitute a broad sender search.

### Safe Links clicks

```kusto
UrlClickEvents
| where Timestamp between (ago(7d) .. now())
| where AccountUpn =~ "<user-upn>"
| where Url has "<domain>" or Url has "<url-token>"
| project Timestamp, AccountUpn, NetworkMessageId, Url, Workload, IPAddress, ThreatTypes, IsClickedThrough, UrlChain
| order by Timestamp asc
| take 200
```

Join to `EmailEvents` on `NetworkMessageId` only when it is populated and the click workload supports that relationship. Drafts and Sent Items can be exceptions.

## Identity and cloud apps

### Current Entra user sign-ins

```kusto
EntraIdSignInEvents
| where Timestamp between (ago(24h) .. now())
| where AccountUpn =~ "<user-upn>"
| project Timestamp, AccountObjectId, AccountUpn, ApplicationId, ResourceId, IPAddress, Country, City, ErrorCode, SessionId, CorrelationId, AuthenticationRequirement, ConditionalAccessStatus, RiskLevelAggregated
| order by Timestamp asc
| take 200
```

Use `EntraIdSignInEvents` for new work. If unavailable, test `AADSignInEventsBeta` only as a stated compatibility fallback or use an accessible Sentinel `SigninLogs` source.

### Service principal and managed identity sign-ins

```kusto
EntraIdSpnSignInEvents
| where Timestamp between (ago(7d) .. now())
| where ServicePrincipalId == "<service-principal-id>" or ApplicationId == "<application-id>"
| project Timestamp, ServicePrincipalId, ServicePrincipalName, IsManagedIdentity, ApplicationId, ResourceId, ResourceTenantId, IPAddress, ErrorCode, CorrelationId, RequestId
| order by Timestamp asc
| take 200
```

### Cloud app activity

```kusto
CloudAppEvents
| where Timestamp between (ago(7d) .. now())
| where AccountObjectId == "<account-object-id>" or OAuthAppId == "<oauth-app-id>" or tostring(ApplicationId) == "<defender-cloud-app-id>"
| project Timestamp, AccountObjectId, AccountId, Application, ApplicationId, AppInstanceId, OAuthAppId, IPAddress, ActionType, ObjectName, ObjectType, ObjectId, ActivityObjects, RawEventData, ReportId
| order by Timestamp asc
| take 200
```

Use `OAuthAppId` for an Entra OAuth client/application ID. `CloudAppEvents.ApplicationId` is a Defender for Cloud Apps catalog identifier and can be numeric; do not compare it directly with an Entra application ID.

### Microsoft Graph API audit activity

`GraphApiAuditEvents.Timestamp` is documented as a string. Convert it before applying the UTC window:

```kusto
GraphApiAuditEvents
| extend EventTime = todatetime(Timestamp)
| where EventTime between (ago(24h) .. now())
| where ApplicationId == "<application-id>" or ServicePrincipalId == "<service-principal-id>"
| project EventTime, ApplicationId, ServicePrincipalId, AccountObjectId, RequestMethod, RequestUri, ResponseStatusCode, IPAddress, Scopes, RequestId, OperationId
| order by EventTime asc
| take 200
```

## Correlation rules

- Apply the time filter to both sides of a join. Put the smaller, already-filtered input on the left.
- `project` the join key and only required evidence fields before joining.
- Prefer `AccountObjectId`, `AccountSid`, `DeviceId`, `NetworkMessageId`, `ProcessUniqueId`, and hashes over names and IPs.
- Use `isnotempty()` before hash or message-ID joins and report unmatched rows.
- When a schema defines a time field as `string`, create a converted `datetime` column before filtering or joining on time.
- Use `arg_max(Timestamp, *)` only when the question is current state; do not collapse an event timeline accidentally.
- Use `has` rather than `contains` for token searches when word-boundary semantics are sufficient; use case-sensitive operators when appropriate.
- Avoid `search *`, unbounded `union`, regex-heavy parsing, and three-character-or-shorter unindexed terms.
- Keep a separate negative query. A positive join is not enough to prove an attack chain, and an empty negative query is not proof of benign activity.
