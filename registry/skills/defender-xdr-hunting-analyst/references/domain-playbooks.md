# Domain Investigation Playbooks

Use the smallest playbook that answers the user's question. Expand domains only when an entity or timeline link justifies it. For all playbooks, preserve UTC timestamps, exact query text, and data gaps.

## Endpoint

### Objective

Determine whether a device or process performed malicious execution, what the parent/child chain was, what it touched, whether it persisted, and whether the behavior spread.

### Flow

1. Retrieve incident and alert evidence. Extract `DeviceId`, device name, file hashes, process names, command lines, account IDs, IPs, and domains.
2. Query `DeviceProcessEvents` in a narrow window around the alert. Use `ProcessUniqueId`, `InitiatingProcessUniqueId`, process creation time, command line, signer/hash fields, and account context.
3. Add `DeviceFileEvents` for download, create, rename, delete, and origin evidence. Prefer `SHA1` for endpoint prevalence when `SHA256` is empty.
4. Use `DeviceFileCertificateInfo` when signer, certificate trust, or publisher reputation matters. Do not infer signing status from a filename or folder.
5. Add `DeviceNetworkEvents` for connections initiated by the suspect process. Use `DeviceNetworkInfo` only when adapter, address, DNS, or connected-network context is needed. Compare remote IP/domain prevalence and timing, but do not treat a shared CDN or proxy as proof of maliciousness.
6. Use `DeviceRegistryEvents` and `DeviceEvents` only for a hypothesis such as persistence, defense evasion, or exploit activity. Filter `ActionType` early.
7. Use `DeviceLogonEvents` and machine logged-on-user enrichment to test interactive, remote, or service-account context.
8. Use `DeviceInfo` with an explicit latest-state strategy for onboarding, OS, tags, asset value, and logged-on-user context. A current state row is not a historical event.
9. Check file/domain/IP related-alert and prevalence tools when they reduce a new hunting query. Record their independent time scope.

### Hypotheses and disconfirmation

- **Malicious execution:** unusual parent-child chain, encoded or downloaded command, unsigned or rare binary, suspicious origin, and related network activity. Disconfirm with signed sanctioned software, expected deployment parent, known change window, and normal prevalence.
- **Credential or remote execution:** remote logon, service account, administrative token, lateral protocol, and process launch near the logon. Disconfirm with approved administration and matching ticket/change context.
- **Persistence:** registry or startup modification followed by later execution. Disconfirm with a known installer or management agent and no subsequent suspicious execution.

### Common gaps

Process IDs recycle. Hash fields are sparse. Device telemetry can be missing for offboarded or unsupported systems. Endpoint RBAC/device groups can hide rows. State tables may lag event tables.

## Defender for Office 365

### Objective

Determine whether a message was malicious, who received it, whether links or attachments were used, whether delivery was remediated, and whether any user action led to identity, cloud, or endpoint activity.

### Flow

1. Start from `AlertEvidence` and `EmailEvents`. Extract `NetworkMessageId`, sender/recipient IDs, subject, delivery action, threat types, authentication results, and attachment/URL counts.
2. Pivot `NetworkMessageId` to `EmailAttachmentInfo` and `EmailUrlInfo`. Record every URL in the chain, including the final destination and QR-code location when present.
3. Query `UrlClickEvents` by message ID and account. Record workload, click-through, IP, threat type, timestamp, and URL chain. A click is user interaction evidence, not proof that the destination executed code.
4. Check `EmailPostDeliveryEvents` for ZAP or other post-delivery actions. Report whether remediation occurred before or after the click.
5. For Microsoft Teams messages, use `MessageEvents`, `MessageUrlInfo`, and `MessagePostDeliveryEvents` when available. Use `CampaignInfo` for Defender-classified email campaign scope and `FileMaliciousContentInfo` for malicious files in SharePoint, OneDrive, and Teams.
6. If an attachment hash is present, pivot to `DeviceFileEvents.SHA256` with `isnotempty()` checks. If the hash is absent, use filename plus message/user/device context only as a weaker pivot.
7. For clicked URLs, use `UrlClickEvents.AccountUpn` to resolve the identity record and obtain `AccountObjectId`, then pivot into `EntraIdSignInEvents` and `CloudAppEvents` in a causal time window. Keep the UPN match labeled as weaker until the immutable ID is resolved. Expand to endpoint only if a device or downloaded file is identified.
8. Cluster recipients by message ID, URL, sender infrastructure, and click timing to estimate campaign scope. Deduplicate aliases and duplicate message records.

### Hypotheses and disconfirmation

- **Phishing with user action:** suspicious authentication/delivery plus click-through plus a subsequent identity or cloud anomaly. Disconfirm with blocked delivery, safe analysis-only click, known security-testing campaign, or no downstream activity.
- **Malicious attachment execution:** message attachment hash joins to endpoint file and process execution on a recipient device. Disconfirm if the file never reached the device or only appeared in a security sandbox.
- **Benign bulk or marketing mail:** normal sender authentication, expected campaign, no suspicious URL chain or user action. Keep the conclusion separate from Defender's delivery verdict.

### Common gaps

Safe Links events from Drafts or Sent Items may not carry a reliable `NetworkMessageId`. Email tables require the right Office 365 product coverage and permissions. Delivery/remediation events can arrive at different times.

## Identity and Entra

### Objective

Determine whether a user, service principal, or managed identity authenticated anomalously, what resource was accessed, whether controls succeeded, and whether directory or query activity supports compromise.

### Flow

1. Extract `AccountObjectId`, `AccountUpn`, `AccountSid`, `ServicePrincipalId`, `ApplicationId`, IP, device ID, correlation/request/session IDs, and alert evidence.
2. Query `EntraIdSignInEvents` for user sign-ins with the smallest useful window. Examine success/failure, IP/geo, device, application/resource, authentication requirement, Conditional Access, and risk fields.
3. Query `EntraIdSpnSignInEvents` for workload identities. Distinguish `ServicePrincipalId` from `ApplicationId`, and distinguish managed identities from ordinary service principals.
4. Use `IdentityLogonEvents` for on-prem or Defender for Identity context, `IdentityDirectoryEvents` for on-prem AD/DC directory changes, and `IdentityQueryEvents` for reconnaissance. Use Sentinel `AuditLogs` for comprehensive Entra directory, role, application, or consent changes when that workspace is available. Do not use these as interchangeable substitutes for complete Entra sign-in or audit history.
5. Use `CloudAppEvents` to test the post-authentication action: application instance, object access, bulk download, OAuth app, source IP, and raw activity fields.
6. Use `GraphApiAuditEvents` where available to test sensitive Graph API operations, application permissions, and service-principal activity.
7. Correlate to endpoint or email only through immutable IDs and causal timing. A matching UPN alone is insufficient.

### Hypotheses and disconfirmation

- **Account takeover:** successful anomalous sign-in followed by resource or cloud-app activity, session continuity, and missing/failed controls. Disconfirm with expected travel/VPN, managed device, approved automation, or successful strong authentication with no downstream anomaly.
- **Service-principal abuse:** unusual IP, resource, tenant, operation, or volume for a service principal or managed identity. Disconfirm with deployment/change evidence and a stable historical baseline.
- **Directory reconnaissance or privilege change:** identity query/directory event followed by access or persistence. Disconfirm with approved administrative activity and no correlated downstream action.

### Common gaps

The current Entra sign-in tables require the documented Entra ID P2 capability plus appropriate permissions. `SigninLogs` and `AuditLogs` are Sentinel/Log Analytics data and need workspace access. Guest, alias, and service accounts can make UPN matching misleading. MFA/Conditional Access fields describe observed control outcomes, not a complete proof that a token was safe.

## Cloud apps

### Objective

Determine whether SaaS activity, OAuth consent, object access, or bulk transfer is related to the alert or identity event.

### Flow

1. Pivot `AccountObjectId`, `AppInstanceId`, `OAuthAppId`, IP, and time into `CloudAppEvents`. Treat `CloudAppEvents.ApplicationId` as a Defender for Cloud Apps catalog identifier, not an Entra OAuth client ID.
2. Use `OAuthAppId` for an Entra OAuth client ID and `OAuthAppInfo` where App Governance is available to inspect consent, permissions, publisher verification, and privilege.
3. Inspect `ActionType`, `ObjectId`, `ObjectName`, `ObjectType`, `ActivityObjects`, `RawEventData`, `AuditSource`, and anomaly fields. Preserve raw fields when the normalized schema is insufficient.
4. Compare the activity with the account's own baseline: application, source IP, time of day, object type, volume, and operation sequence.
5. If an OAuth app or service principal is involved, correlate to `EntraIdSpnSignInEvents` and `GraphApiAuditEvents` where available. Convert `GraphApiAuditEvents.Timestamp` to `datetime` before filtering.
6. Trace downstream files, links, or device activity only when an entity key or causal time sequence exists.

### Common gaps

Cloud app coverage depends on app connectors and selected activity sources. `ApplicationId`, `AppInstanceId`, `OAuthAppId`, and service-principal IDs have different semantics. `OAuthAppInfo` requires App Governance where available and does not enumerate every first-party or nonconsented app. A high-volume action can be normal for backup, sync, or eDiscovery automation.

## Cross-domain correlation

Use a staged chain rather than a single giant join:

1. **Seed:** incident/alert and evidence.
2. **Anchor:** one strong entity key such as `NetworkMessageId`, `DeviceId`, `ProcessUniqueId`, `AccountObjectId`, `ServicePrincipalId`, hash, or exact alert ID.
3. **Temporal link:** define a causal window and apply it to every participating table.
4. **Behavioral link:** require a compatible action sequence, not just shared identity or IP.
5. **Independent corroboration:** obtain a second product's telemetry or a prevalence baseline.
6. **Disconfirm:** search for sanctioned activity, security testing, expected automation, or an alternate entity.
7. **Blast radius:** expand only from confirmed keys and record the stopping rule.

Useful paths include:

- Email message -> URL/attachment -> click `AccountUpn` -> identity lookup to `AccountObjectId` -> Entra sign-in -> cloud-app action.
- Email attachment hash -> endpoint file -> process lineage -> network destination.
- Entra sign-in -> `AccountObjectId`/device -> cloud-app access -> Graph API audit -> endpoint evidence.
- Service-principal sign-in -> application/resource -> cloud activity -> affected users or devices.

Shared IP, domain, display name, or account local-part alone is a lead. Label it as a weak pivot until an immutable key and causal sequence corroborate it.
