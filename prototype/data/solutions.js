window.SOLUTIONS = [
{
"t": "IT Infrastructure Solutions",
"d": "Turnkey design, supply and deployment of server, storage and workplace infrastructure."
},
{
"t": "AMC (Annual Maintenance Contract)",
"d": "Scheduled preventive maintenance with guaranteed response SLAs across UAE sites."
},
{
"t": "Managed Services",
"d": "Fully outsourced IT operations, monitoring and lifecycle management for SMEs and enterprises."
},
{
"t": "Network and IT Security Solutions",
"d": "Secure switching, routing and access with policy-based segmentation."
},
{
"t": "Firewall Solutions",
"d": "Next-generation firewall supply, configuration and rule-base management."
},
{
"t": "Cloud Security Solutions",
"d": "Identity, mail and endpoint protection delivered from the cloud."
},
{
"t": "Structured Cabling",
"d": "Certified copper and fiber structured cabling for offices, warehouses and retail."
},
{
"t": "AV and Meeting Room Solutions",
"d": "Conference displays, audio and video conferencing rooms, ready to hybrid work."
},
{
"t": "IP Telephony Solutions",
"d": "IP PBX, desk phones and SIP trunks replacing legacy telephony."
},
{
"t": "Data Recovery, Storage Solutions",
"d": "Backup architecture and recovery services built on our storage DNA."
},
{
"t": "Software & Licensing Support",
"d": "Licensing advisory and deployment support, now extended with Unisoft engineering."
},
{
"t": "Support and Maintenance",
"d": "Break-fix and consumables logistics with JAFZA-fulfilled spare pools."
}
];

/* IT-solution deep-dive (v1.6.0): one detail record per solution line — scope, process,
   FAQ and cross-navigation. AMC renders the real 3-tier SLA table (content §05-02).
   related ids ⊆ this list; cats ⊆ catalog category ids. */
window.ITSOL = [
{ id: 'infra', icon: '🖧', t: 'IT Infrastructure Solutions', d: 'Turnkey design, supply and deployment of server, storage and workplace infrastructure.',
  what: 'One accountable partner for the whole estate — workplace devices, servers, storage and the network that binds them, specified from our 81-SKU authorized portfolio, staged at JAFZA and deployed to site with documentation your next auditor can follow.',
  scope: [['Workplace infrastructure', ['Laptops, desktops and monitors from stock', 'Standard golden images and BIOS policies', 'Docking, UPS and accessory kits']], ['Server & storage', ['Sizing from workload, not vendor rebate', 'Virtualization and shared storage design', 'Warranty and DOA handling through our desk']], ['Deployment', ['Staging and imaging at JAFZA before site', 'Data and profile migration', 'Site documentation and asset register handover']], ['Lifecycle', ['Refresh planning with real failure data', 'Trade-in and disposal handling', 'Standardization roadmaps per department']]],
  process: [['1 · Assess', 'Inventory and workload baseline; gaps and end-of-life flagged against refresh budget'], ['2 · Stage', 'Devices imaged, tested and asset-tagged at JAFZA; delivery scheduled per site'], ['3 · Deploy & hand over', 'Rollout in waves with per-site sign-off and the asset register documented']],
  faq: [['Can you supply and deploy kit we already chose?', 'Yes — supply-only and supply+deploy are both standard; our value is the JAFZA staging and single desk for warranty.'], ['We buy from several brands — problem?', 'No. The portfolio spans 23 authorized brands; standardization guidance is advice, never a condition.']],
  related: ['managed', 'support'], cats: ['laptops', 'monitors'] },
{ id: 'amc', icon: '📅', t: 'AMC (Annual Maintenance Contract)', d: 'Scheduled preventive maintenance with guaranteed response SLAs across UAE sites.',
  what: 'Comprehensive maintenance covering hardware, software and network infrastructure with defined SLA tiers, proactive monitoring and 24/7 support options — the response-time promise is written into the contract, not the brochure.',
  scope: [['Preventive maintenance', ['Scheduled visits: quarterly, monthly or unlimited by tier', 'Firmware, patch and health-check cycles', 'Asset condition reports per visit']], ['Response & resolution', ['Contracted response: 1h / 4h / next business day', 'Resolution targets per tier (see SLA table)', 'Escalation path named in the contract']], ['Spares & logistics', ['JAFZA-fulfilled spare pool for covered assets', 'Advance replacement where warranty allows', 'Consumables logistics for printers and devices']], ['Reporting', ['SLA performance reports per period', 'Incident and root-cause summaries', 'Quarterly review with recommendations']]],
  process: [['1 · Asset audit', 'Covered assets inventoried; age, criticality and warranty mapped'], ['2 · Tier selection', 'Response/resolution tier chosen per asset class — critical systems on 1h, edge devices on NBD'], ['3 · Contract & SLA reporting', 'Annual contract with named escalation; SLA performance reported every period']],
  faq: [['Is AMC only for hardware we bought from Simal?', 'No — the service desk is vendor-agnostic; third-party assets enter the contract after an intake audit.'], ['What is excluded from an AMC?', 'Physical damage, consumables beyond contracted volumes and out-of-scope software changes — exclusions are listed in the contract, not discovered at invoice time.']],
  related: ['support', 'managed'], cats: [], tiers: true },
{ id: 'managed', icon: '📦', t: 'Managed Services', d: 'Fully outsourced IT operations, monitoring and lifecycle management for SMEs and enterprises.',
  what: 'Your IT department, contracted — monitoring, patching, user support and lifecycle planning run to an SLA, with a named service manager and monthly reporting that ties every dirham spent to tickets closed and risks retired.',
  scope: [['Monitoring & alerting', ['24/7 infrastructure and endpoint monitoring', 'Alert triage before users notice', 'Monthly availability reporting']], ['Patch & configuration', ['OS and third-party patch cycles', 'Standard hardened configurations', 'Drift detection and remediation']], ['User support', ['Helpdesk with contracted response tiers', 'Onboarding / offboarding automation', 'Asset tracking per user']], ['Planning', ['Named service manager', 'Quarterly roadmap and budget reviews', 'Lifecycle and refresh planning']]],
  process: [['1 · Onboard', 'Environment discovery, monitoring agents and access model set up in weeks, not quarters'], ['2 · Stabilize', 'Backlog burned down; patch levels and alert noise brought to baseline'], ['3 · Run & improve', 'SLA reporting monthly; roadmap reviews quarterly with your service manager']],
  faq: [['We have internal IT — does managed replace them?', 'No — most deployments co-manage: we take monitoring, patching and after-hours, your team keeps strategy and intimate apps.'], ['How is pricing structured?', 'Per-user or per-asset bands from the discovery inventory — quoted before onboarding, no per-ticket surprises.']],
  related: ['amc', 'infra'], cats: [] },
{ id: 'network-security', icon: '🔐', t: 'Network and IT Security Solutions', d: 'Secure switching, routing and access with policy-based segmentation.',
  what: 'Networks designed so the blast radius of any compromise is one VLAN, not the company — segmented switching, controlled wireless and access policy designed, supplied and documented.',
  scope: [['Segmentation', ['VLAN design per department and device class', 'Guest and IoT isolation by default', 'Inter-zone policy documented and reviewable']], ['Switching & routing', ['Access and distribution switching from the authorized portfolio', 'Redundant uplink and gateway design', 'Configuration standards and backups']], ['Secure access', ['802.1X / NAC readiness', 'Wireless with certificate-based access', 'Visitor networks with time-boxed access']], ['Physical security', ['Surveillance and access-control integration (Hikvision line)', 'Camera-to-VLAN isolation', 'Retention aligned to policy']]],
  process: [['1 · Discover', 'Current topology, traffic flows and compliance needs mapped'], ['2 · Design', 'Segmentation and access policy designed and reviewed with your team'], ['3 · Implement', 'Staged changes with rollback plans; as-built documentation handed over']],
  faq: [['Will segmentation break our legacy applications?', 'Inter-zone rules are piloted in monitor mode first; nothing is enforced until flows are proven.'], ['Do you also maintain the network after deployment?', 'Yes — under an AMC or managed contract, with config backups and change control.']],
  related: ['firewall', 'cloud-security'], cats: [] },
{ id: 'firewall', icon: '🧱', t: 'Firewall Solutions', d: 'Next-generation firewall supply, configuration and rule-base management.',
  what: 'Next-generation firewall supply and lifecycle — sizing, deployment, rule-base hygiene and continuous management of the perimeter and internal segmentation checkpoints (Sophos XG practice from the flagship portfolio).',
  scope: [['Sizing & supply', ['Throughput and session sizing from real traffic', 'HA pairs for critical sites', 'Subscription licensing managed and renewed']], ['Deployment', ['Zero-downtime insertion or migration paths', 'Policy translation from legacy firewalls', 'VPN mesh for multi-site and remote staff']], ['Rule-base management', ['Rule cleanup and shadowing removal', 'Change control with documented tickets', 'Periodic policy review']], ['Monitoring', ['Log retention and alerting', 'Monthly usage and threat reports', 'Coordinated response with cloud security layer']]],
  process: [['1 · Baseline', 'Traffic flows, applications and risk appetite documented'], ['2 · Deploy', 'Policy built clean — not migrated stale; cutover with rollback'], ['3 · Manage', 'Rule-base under change control; health and threat reporting per period']],
  faq: [['Can you take over an existing firewall we didn\'t buy from you?', 'Yes — takeover starts with a rule-base audit; cleanup findings come before any upsizing recommendation.'], ['What happens when the subscription expires?', 'Renewals are tracked by our desk and flagged 60 days ahead — lapse-driven outages are a solved problem.']],
  related: ['network-security', 'cloud-security'], cats: [] },
{ id: 'cloud-security', icon: '☁️', t: 'Cloud Security Solutions', d: 'Identity, mail and endpoint protection delivered from the cloud.',
  what: 'Threat detection, identity & access management, encryption and compliance management with 24/7 security operations against ransomware, phishing and DDoS — the cloud-delivered layer that protects users wherever they work.',
  scope: [['Identity & access', ['MFA rollout and conditional access', 'SSO across SaaS estate', 'Privileged access governance']], ['Mail security', ['Advanced phishing and impersonation defense', 'Quarantine workflows users actually follow', 'DMARC/DKIM/SPF alignment']], ['Endpoint protection', ['EDR deployment and tuning', 'Ransomware rollback readiness', 'Disk and backup encryption']], ['Compliance & response', ['Policy baselines for audits', '24/7 monitoring and alert triage', 'Incident response runbooks']]],
  process: [['1 · Assess', 'Identity, mail and endpoint exposure tested; quick wins ranked'], ['2 · Roll out', 'MFA and EDR first — the two controls that stop the majority of attacks'], ['3 · Operate', '24/7 monitoring with monthly incident and posture reports']],
  faq: [['We already have antivirus — is this different?', 'Yes — ETR/EDR detects behavior, not signatures; paired with MFA it addresses the attacks antivirus misses.'], ['Who responds at 2 a.m.?', 'The security operations tier alerts, triages and contains per runbook, with escalation contacts named in the contract.']],
  related: ['firewall', 'network-security'], cats: [] },
{ id: 'cabling', icon: '🪛', t: 'Structured Cabling', d: 'Certified copper and fiber structured cabling for offices, warehouses and retail.',
  what: 'Certified cabling infrastructure — copper and fiber designed, installed and label-tested for offices, warehouses and retail floors, with test reports per drop and as-built drawings you can hand to anyone.',
  scope: [['Design', ['Cable counts and pathways from floor plans', 'Copper Cat6/6A and fiber backbones', 'Warehouse and retail environment hardening']], ['Installation', ['Certified installer crews', 'Labeling per rack and drop', 'Patch panel and cabinet standards']], ['Testing', ['Fluke-certified test results per outlet', 'Fiber OTDR results on backbone links', 'Warranty registration with manufacturer']], ['Documentation', ['As-built drawings and port maps', 'Patch records maintained', 'Expansion plans annotated']]],
  process: [['1 · Survey', 'Site walk with floor plans; counts, pathways and containment quoted'], ['2 · Install', 'Phased installation that keeps the business running; daily cleanup'], ['3 · Certify & document', 'Every drop tested, every label matched, as-builts handed over']],
  faq: [['Can you work weekends or after hours?', 'Yes — phased out-of-hours schedules are standard for occupied offices and live warehouses.'], ['Do you certify the installation?', 'Every copper drop is Fluke-tested and fiber runs get OTDR results — reports are part of handover.']],
  related: ['network-security', 'infra'], cats: [] },
{ id: 'av', icon: '🎥', t: 'AV and Meeting Room Solutions', d: 'Conference displays, audio and video conferencing rooms, ready to hybrid work.',
  what: 'Nearity all-in-one conferencing systems, professional displays, audio and control — designed and installed for huddle rooms, boardrooms and conference halls, with the displays and accessories supplied from the same authorized stock.',
  scope: [['Room design', ['Huddle, boardroom and hall sizing', 'Sight-line and acoustic planning', 'Standard BYOD vs room-system choices']], ['Conferencing systems', ['Nearity all-in-one mic/speaker/camera units', 'Platform bring-your-own or native room systems', 'Single-cable and wireless present options']], ['Displays & control', ['Professional displays from the catalog', 'Mounting, power and cable concealment', 'One-touch room control']], ['Support', ['Commissioning and user walkthroughs', 'Firmware and platform updates', 'AMC coverage for room hardware']]],
  process: [['1 · Design', 'Room-by-room use cases and standards agreed — not one-size-fits-all'], ['2 · Install', 'Displays, audio and cabling installed and commissioned off-hours where needed'], ['3 · Adopt', 'User walkthroughs and quick-reference cards; support path to the service desk']],
  faq: [['Which meeting platforms are supported?', 'The Nearity line works with the major platforms; native room-system variants are quoted per room.'], ['Can rooms be added one at a time?', 'Yes — the standard scales per room; pilots often start with one boardroom and one huddle room.']],
  related: ['infra', 'support'], cats: ['monitors', 'accessories'] },
{ id: 'telephony', icon: '☎️', t: 'IP Telephony Solutions', d: 'IP PBX, desk phones and SIP trunks replacing legacy telephony.',
  what: 'Replace the legacy PBX with IP telephony — desk phones, soft clients and SIP trunks designed for UAE businesses, with number portability handled and the old system decommissioned cleanly.',
  scope: [['IP PBX', ['On-premise or hosted PBX sizing', 'Auto-attendant, hunt groups and queues', 'Integration with CRM/helpdesk where needed']], ['Endpoints', ['Desk phones and conference units', 'Soft clients for remote staff', 'Headset and accessory kits']], ['Connectivity', ['SIP trunk provisioning and number porting', 'Call routing and failover design', 'QoS alignment with the network layer']], ['Support', ['Moves/adds/changes as a service', 'Trunk monitoring and alerting', 'AMC option for the PBX estate']]],
  process: [['1 · Discover', 'Extensions, call flows and trunk usage mapped from the legacy system'], ['2 · Migrate', 'Parallel running with number porting scheduled to the minute'], ['3 · Decommission', 'Legacy PBX retired; documentation and MAC process handed over']],
  faq: [['Can we keep our existing phone numbers?', 'Yes — number porting is part of the migration plan, timed to avoid disruption.'], ['What about staff working from home?', 'Soft clients register securely from anywhere; the desk phone becomes optional, not mandatory.']],
  related: ['network-security', 'managed'], cats: [] },
{ id: 'data-recovery', icon: '💾', t: 'Data Recovery, Storage Solutions', d: 'Backup architecture and recovery services built on our storage DNA.',
  what: 'Enterprise data recovery plus storage architecture — NAS, SAN, cloud storage and backup strategy design. Recover data from failed drives and corrupted systems, then design the storage so it never happens twice.',
  scope: [['Data recovery', ['Failed drive and RAID recovery triage', 'Corrupted filesystem and volume repair', 'No-recovery, no-fee assessment']], ['Storage architecture', ['NAS and SAN design on storage DNA', 'Capacity, tiering and growth planning', 'Shared storage for virtualization']], ['Backup strategy', ['3-2-1 backup architecture design', 'RPO/RTO agreed per workload', 'Immutable / offline copy for ransomware resilience']], ['Recovery assurance', ['Restore testing scheduled, not assumed', 'Disaster-recovery runbooks', 'Recovery drills with timing evidence']], ['Catalog depth', ['SSD and memory tiers from the 81-SKU portfolio', 'Crucial performance and pro lines', 'Enterprise drive sourcing']]],
  process: [['1 · Triage', 'Failed media assessed; recoverability and quote before work starts'], ['2 · Recover', 'Imaging-based recovery in controlled conditions, original media preserved'], ['3 · Harden', 'Findings feed the backup/storage design so the failure mode is closed']],
  faq: [['What are the odds my data is recoverable?', 'A controlled assessment answers that before you commit — no-recovery, no-fee on the evaluation.'], ['Do you only recover, or also fix the architecture?', 'Both — recovery is the emergency; the storage and backup design closes the root cause.']],
  related: ['infra', 'cloud-security'], cats: ['internal-ssd', 'portable-ssd', 'memory'] },
{ id: 'licensing', icon: '🧾', t: 'Software & Licensing Support', d: 'Licensing advisory and deployment support, now extended with Unisoft engineering.',
  what: 'Licensing advisory and deployment support — compliance position mapped, renewals tracked, and since the software business line: deployment engineering from the Unisoft team behind it.',
  scope: [['Advisory', ['License position audits', 'True-up planning and budget smoothing', 'Vendor program guidance']], ['Procurement', ['Renewal tracking with 60-day flags', 'Multi-vendor consolidation', 'License delivery and activation management']], ['Deployment support', ['Rollout engineering via the Unisoft practice', 'Integration with existing estates', 'Admin training and handover']], ['Compliance', ['Audit-readiness evidence packs', 'Usage vs entitlement reporting', 'Decommissioning and license reuse']]],
  process: [['1 · Map', 'Entitlements vs deployments reconciled — the true position, not the assumed one'], ['2 · Optimize', 'Gaps closed, waste reassigned; renewals put on a tracked calendar'], ['3 · Support', 'Deployment engineering and audit-ready reporting on request']],
  faq: [['We were flagged for a vendor audit — can you help?', 'Yes — the license-position audit produces the evidence pack; remediation options come with it.'], ['Is this tied to buying licenses from Simal?', 'No — advisory stands alone; procurement is offered, not required.']],
  related: ['amc', 'support'], cats: [] },
{ id: 'support', icon: '🔧', t: 'Support and Maintenance', d: 'Break-fix and consumables logistics with JAFZA-fulfilled spare pools.',
  what: 'Break-fix repair logistics and consumables supply running on JAFZA-fulfilled spare pools — the non-contract sibling of AMC for organizations that need reliable fixes without an annual commitment.',
  scope: [['Break-fix', ['Repair intake and triage via the service desk', 'Vendor warranty coordination', 'Advance replacement where available']], ['Spares logistics', ['JAFZA-held spare pools for common lines', 'Same/next business day dispatch in UAE', 'GCC same-week shipping']], ['Consumables', ['Printer and device consumables supply', 'Stocked min-max per agreement', 'Scheduled replenishment']], ['Escalation path', ['Named desk contacts', 'Repair status visibility', 'Path into AMC when volume justifies it']]],
  process: [['1 · Log', 'Ticket logged with the desk; triage and ETA issued'], ['2 · Fix', 'Repair, RMA or advance-replacement per warranty and stock'], ['3 · Report', 'Repair history per asset — the data that later right-sizes an AMC tier']],
  faq: [['No contract — how is response time handled?', 'Break-fix runs best-effort with stock-based ETAs; contracted response times are the AMC tier table\'s job.'], ['When does break-fix stop making sense?', 'When repair frequency crosses a threshold the desk will show you — the data argues for the AMC tier, not the salesperson.']],
  related: ['amc', 'licensing'], cats: [] }
];
