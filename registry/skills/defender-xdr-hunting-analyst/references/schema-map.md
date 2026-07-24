# Microsoft Defender XDR Schema and Join Map

Use this as a routing index, not as a replacement for the live schema. The official table pages are authoritative because table availability, columns, product licensing, and permissions change. The links below were checked on 2026-07-24.

## Table of contents

1. [Canonical table index](#canonical-table-index)
2. [Join keys](#join-keys)
3. [Retention and availability](#retention-and-availability)
4. [Official references](#official-references)

## Canonical table index

| Domain | Table | Use | High-value columns and pivots | Source |
|---|---|---|---|---|
| Endpoint | `DeviceProcessEvents` | Process creation and process context | `Timestamp`, `DeviceId`, `DeviceName`, `FileName`, `FolderPath`, `SHA1`, `SHA256`, `ProcessCommandLine`, `ProcessId`, `ProcessCreationTime`, `ProcessUniqueId`, `InitiatingProcessUniqueId`, initiating account fields, `LogonId`, `ReportId` | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-deviceprocessevents-table) |
| Endpoint | `DeviceFileEvents` | File create, modify, delete, download, and origin | `DeviceId`, `Timestamp`, `FileName`, `FolderPath`, `SHA1`, `SHA256`, `FileOriginUrl`, `FileOriginIP`, previous path/name, initiating process fields, `RequestSourceIP`, `ReportId` | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-devicefileevents-table) |
| Endpoint | `DeviceNetworkEvents` | Network connections | `DeviceId`, `Timestamp`, `RemoteIP`, `RemoteUrl`, local/remote ports, `Protocol`, `InitiatingProcessUniqueId`, initiating account fields, `ReportId` | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-devicenetworkevents-table) |
| Endpoint | `DeviceEvents` | Heterogeneous AV, exploit, registry, and other device events | `DeviceId`, `Timestamp`, `ActionType`, `AdditionalFields`, file/process/URL/IP/account fields, `InitiatingProcessUniqueId`, `ReportId` | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-deviceevents-table) |
| Endpoint | `DeviceLogonEvents` | Local and remote device authentication | `DeviceId`, `Timestamp`, `ActionType`, `LogonType`, `AccountSid`, `AccountName`, `LogonId`, `RemoteIP`, `Protocol`, `FailureReason`, `IsLocalAdmin`, initiating process fields | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-devicelogonevents-table) |
| Endpoint | `DeviceRegistryEvents` | Registry create, modify, and delete activity | `DeviceId`, `Timestamp`, `ActionType`, `RegistryKey`, `RegistryValueName`, `RegistryValueData`, initiating process IDs and account fields | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-deviceregistryevents-table) |
| Endpoint | `DeviceImageLoadEvents` | DLL/image load activity | `DeviceId`, `Timestamp`, `FileName`, `FolderPath`, hashes, `InitiatingProcessUniqueId`, initiating process and account fields | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-deviceimageloadevents-table) |
| Endpoint | `DeviceFileCertificateInfo` | File signer, certificate, and trust context | file hash, certificate subject/issuer, signer, validity, and trust fields | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-devicefilecertificateinfo-table) |
| Endpoint | `DeviceNetworkInfo` | Device network adapter and connected-network context | `DeviceId`, adapter, IP, MAC, DNS, connected network, and domain fields | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-devicenetworkinfo-table) |
| Endpoint | `DeviceInfo` | Current or aggregated device state | `DeviceId`, `DeviceName`, `AadDeviceId`, OS fields, `LoggedOnUsers`, `MachineGroup`, onboarding/sensor state, exposure/asset value, tags | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-deviceinfo-table) |
| Endpoint posture | `DeviceTvmSoftwareInventory` | Installed software and versions | device identity, software name/version/vendor, exposure and vulnerability pivots | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-devicetvmsoftwareinventory-table) |
| Endpoint posture | `DeviceTvmSoftwareVulnerabilities` | Vulnerability exposure | device identity, software, `CveId`, severity, remediation fields | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-devicetvmsoftwarevulnerabilities-table) |
| Office 365 | `EmailEvents` | Message processing, delivery, threats, sender and recipient | `Timestamp`, `NetworkMessageId`, `InternetMessageId`, sender/recipient addresses and object IDs, `Subject`, delivery fields, threat verdicts, authentication details, attachment/URL counts | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-emailevents-table) |
| Office 365 | `EmailAttachmentInfo` | Attachments and attachment verdicts | `NetworkMessageId`, sender/recipient IDs, `FileName`, `FileType`, `SHA256`, `FileSize`, threat verdict/detection fields | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-emailattachmentinfo-table) |
| Office 365 | `EmailUrlInfo` | URLs embedded in messages and attachments | `NetworkMessageId`, `Url`, `UrlDomain`, `UrlLocation`, `UrlChainId`, `UrlChainPosition`; `UrlLocation == "QRCode"` can identify QR-extracted URLs | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-emailurlinfo-table) |
| Office 365 | `UrlClickEvents` | Safe Links clicks from email, Teams, and supported Office workloads | `Timestamp`, `NetworkMessageId`, `Url`, `AccountUpn`, `Workload`, `IPAddress`, `ThreatTypes`, `IsClickedThrough`, `UrlChain`, `ReportId`, `SourceId` | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-urlclickevents-table) |
| Office 365 | `EmailPostDeliveryEvents` | Post-delivery actions such as ZAP or remediation | message ID, delivery action, action type, recipient, and threat context | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-emailpostdeliveryevents-table) |
| Collaboration | `MessageEvents` | Microsoft Teams message activity where enabled | Teams message ID, sender/recipient, message metadata, threat, and delivery context | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-messageevents-table) |
| Collaboration | `MessageUrlInfo` | URLs in Microsoft Teams messages | `Timestamp`, `TeamsMessageId`, `Url`, `UrlDomain`, `ThreatTypes`, and `ReportId` | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-messageurlinfo-table) |
| Collaboration | `MessagePostDeliveryEvents` | Post-delivery security actions on Microsoft Teams messages | Teams message ID, recipient, action type, delivery/remediation, and threat context | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-messagepostdeliveryevents-table) |
| Office 365 | `CampaignInfo` | Defender-classified email campaign scope and metadata | campaign ID, campaign type, classification, first/last seen, message, and recipient scope | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-campaigninfo-table) |
| Collaboration and files | `FileMaliciousContentInfo` | Malicious file/content signals in SharePoint, OneDrive, and Teams | file identity, service/workload, detection, threat context, and source object | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-filemaliciouscontentinfo-table) |
| Identity | `IdentityLogonEvents` | On-prem AD authentication and some online-service activity | `AccountSid`, `AccountObjectId`, `AccountUpn`, source/destination device, `IPAddress`, `Protocol`, `LogonType`, `FailureReason`, `ReportId` | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-identitylogonevents-table) |
| Identity | `IdentityDirectoryEvents` | AD/DC directory and system changes | account and target account IDs, target/destination device and IP, `ActionType`, `AdditionalFields`, `ReportId` | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-identitydirectoryevents-table) |
| Identity | `IdentityQueryEvents` | Directory queries and reconnaissance | `QueryType`, `QueryTarget`, `Query`, account IDs, source/destination device and IP, `ReportId` | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-identityqueryevents-table) |
| Identity | `IdentityInfo` | Identity/account state and risk context in tenants where available | account IDs, UPN, display and risk fields, organizational context | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-identityinfo-table) |
| Identity | `IdentityAccountInfo` | Entra account information in current tenants where available | account object ID, UPN, display name, account type and status fields | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-identityaccountinfo-table) |
| Entra | `EntraIdSignInEvents` | Current interactive and non-interactive user sign-ins | `Timestamp`, `CorrelationId`, `RequestId`, `ReportId`, `SessionId`, `AccountObjectId`, `AccountUpn`, `ApplicationId`, `ResourceId`, `ResourceTenantId`, `EntraIdDeviceId`, `IPAddress`, `ErrorCode`, authentication, CA, and risk fields | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-entraidsigninevents-table) |
| Entra | `EntraIdSpnSignInEvents` | Service-principal and managed-identity sign-ins | `ServicePrincipalId`, `ServicePrincipalName`, `IsManagedIdentity`, `ApplicationId`, `ResourceId`, `ResourceTenantId`, `CorrelationId`, `RequestId`, `ReportId`, `IPAddress`, `ErrorCode` | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-entraidspnsigninevents-table) |
| Cloud apps | `CloudAppEvents` | SaaS activity, object access, OAuth/app, and anomaly context | `AccountObjectId`, `AccountId`, `Application`, integer Defender Cloud Apps `ApplicationId`, `AppInstanceId`, string Entra `OAuthAppId`, `IPAddress`, `ObjectId`, `ActivityObjects`, `ReportId`, `RawEventData`, `AuditSource`, anomaly fields | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-cloudappevents-table) |
| Cloud apps | `OAuthAppInfo` | OAuth app governance and consent context where App Governance is available | OAuth app ID, tenant service-principal ID, permissions, admin consent, publisher verification, privilege, origin, status, and last use | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-oauthappinfo-table) |
| Cross-product | `AlertInfo` | Alert metadata from Endpoint, Office 365, Cloud Apps, and Identity | `AlertId`, `Timestamp`, `Title`, `Category`, `Severity`, `ServiceSource`, `DetectionSource`, `AttackTechniques` | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-alertinfo-table) |
| Cross-product | `AlertEvidence` | Entities associated with alerts | `AlertId`, `DeviceId`, account IDs, `NetworkMessageId`, hashes, `RemoteIP`, `RemoteUrl`, `ApplicationId`, cloud resource IDs | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-alertevidence-table) |
| Cross-product | `GraphApiAuditEvents` | Microsoft Graph API requests where enabled and available | string `Timestamp`, `ApplicationId`, `ServicePrincipalId`, `AccountObjectId`, request/operation IDs, URI, method, status, scopes, and source IP | [schema](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-graphapiauditevents-table) |
| Sentinel | `SigninLogs` | Log Analytics/Sentinel Entra sign-in data, not guaranteed Defender-native data | `TimeGenerated`, `Id`, `CorrelationId`, `OriginalRequestId`, `SessionId`, `UserId`, `UserPrincipalName`, `AppId`, `ServicePrincipalId`, `ResourceId`, `DeviceDetail`, `IPAddress`, `ResultType`, CA and risk fields | [schema](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/signinlogs) |
| Sentinel | `AuditLogs` | Entra directory, role, application, consent, and policy audit data when connected to Sentinel | `TimeGenerated`, activity/category, operation, result, initiator, target resources, and additional details | [schema](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/auditlogs) |

The official index is the authority for tables not listed here: [Advanced Hunting schema tables](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-schema-tables).

## Join keys

Use the strongest available key first, then constrain by time and device/account scope:

| Pivot | Use | Caveat |
|---|---|---|
| `AlertInfo.AlertId == AlertEvidence.AlertId` | Alert metadata to entities | One alert may have many evidence rows; deduplicate before expansion. |
| `DeviceId` | Endpoint timeline and device state | Keep `Timestamp` and do not assume a device name is unique. |
| `ProcessUniqueId` to `InitiatingProcessUniqueId` | Windows process lineage | If missing, combine device, PID, and process creation time; PIDs recycle. |
| `ReportId + DeviceName + Timestamp` | Endpoint event uniqueness | `ReportId` alone is not a universal key and repeats. |
| `NetworkMessageId` | `EmailEvents`, `EmailAttachmentInfo`, `EmailUrlInfo`, and most `UrlClickEvents` | Safe Links clicks from Drafts or Sent Items may lack a reliable message ID. |
| `EmailAttachmentInfo.SHA256 == DeviceFileEvents.SHA256` | Email attachment to endpoint file | Hashes can be sparse; require `isnotempty()` on both sides. |
| `AccountObjectId` | Entra, identity, cloud-app account joins | Prefer immutable object IDs over UPN or display name. |
| `AccountSid` | On-prem identity joins | Do not expect it on cloud-only accounts. |
| `AccountUpn` | Human-readable account fallback | Treat as a fallback because aliases and guest formats vary. |
| `CorrelationId`, `RequestId`, `SessionId` | Entra sign-in session/request correlation | These IDs are event-specific; validate their semantic scope before joining. |
| `OAuthAppId`, `ServicePrincipalId`, and typed `ApplicationId` | Cloud app and workload identity pivots | `CloudAppEvents.ApplicationId` is a Defender for Cloud Apps catalog ID; use `OAuthAppId` for an Entra OAuth client ID. An application ID is not the same as a service-principal object ID. |
| IP, domain, URL | Secondary corroboration and IOC search | Shared infrastructure and NAT make these weak causal keys. |

## Retention and availability

- Defender-native Advanced Hunting data is normally queryable for up to 30 days. Longer history requires data actually streamed to Microsoft Sentinel or another supported long-term store; it is not retroactive.
- Entity tables can be consolidated periodically rather than arriving like event tables. State the possible ingestion lag when using `DeviceInfo` or identity inventory data.
- Product deployment, connector configuration, licensing, RBAC/device groups, cloud environment, and API permissions change which tables and rows are visible.
- `EntraIdSignInEvents` and `EntraIdSpnSignInEvents` are the current table names for new work. The `AAD*Beta` tables are legacy replacement references and may be absent.
- `EntraIdSignInEvents` and `EntraIdSpnSignInEvents` require the appropriate Entra ID P2 capability in the documented product scope.
- `IdentityLogonEvents` is not a complete substitute for comprehensive Entra sign-in history. Use the current Entra tables or Sentinel `SigninLogs` when available.
- `IdentityDirectoryEvents` is primarily Defender for Identity on-premises directory/DC telemetry. For comprehensive Entra directory, role, consent, or application audit history, use Sentinel `AuditLogs` or another explicitly available Entra audit source.
- `GraphApiAuditEvents.Timestamp` is a string. Convert it with `todatetime(Timestamp)` before filtering or joining on time.
- `OAuthAppInfo` requires Defender for Cloud Apps App Governance where available, excludes some first-party or nonconsented apps, and may be preview data. Absence is not proof that no OAuth app exists.
- `MessageUrlInfo` and `FileMaliciousContentInfo` can be preview surfaces. Re-check their official pages and live schema before relying on them in a production query.
- An empty result means no matching accessible rows in the queried scope. It does not prove that the behavior never happened when retention, permissions, product coverage, or table availability is uncertain.

## Official references

- [Advanced Hunting overview](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-overview)
- [Cross-domain hunting: emails, devices, apps, and identities](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-query-emails-devices)
- [Advanced Hunting best practices](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-best-practices)
- [Graph `runHuntingQuery`](https://learn.microsoft.com/en-us/graph/api/security-security-runhuntingquery?view=graph-rest-1.0)
- [Effective hunting schema discovery, beta](https://learn.microsoft.com/en-us/graph/api/security-security-gethuntingschema?view=graph-rest-beta)
- [Advanced Hunting with Sentinel data](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-microsoft-defender)
