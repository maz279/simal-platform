/* Structured content from the /content package (Simal content files).
   Sources: 05_Solutions, 06_Software_ERP, 07_Partners, 08_Resources,
   02_About_Us, 09_Careers — condensed for prototype use. */
window.CONTENT = {
  solutions5: [
    { slug: 'amc', t: 'Annual Maintenance Contract (AMC)', tag: 'Keep infrastructure at peak performance',
      d: 'Comprehensive maintenance covering hardware, software and network infrastructure with defined SLA tiers, proactive monitoring and 24/7 support options.', icon: '📅' },
    { slug: 'av', t: 'AV & Meeting Room Solutions', tag: 'Transform how teams collaborate',
      d: 'Nearity all-in-one conferencing systems, professional displays, audio and control — designed and installed for huddle rooms, boardrooms and conference halls.', icon: '🎥' },
    { slug: 'cloud', t: 'Cloud Security Solutions', tag: 'Protect business data',
      d: 'Threat detection, identity & access management, encryption and compliance management with 24/7 security operations against ransomware, phishing and DDoS.', icon: '☁️' },
    { slug: 'storage', t: 'Data Recovery & Storage', tag: 'Your most valuable asset, protected',
      d: 'Enterprise data recovery plus storage architecture — NAS, SAN, cloud storage and backup strategy design. Recover data from failed drives and corrupted systems.', icon: '💾' },
    { slug: 'firewall', t: 'Firewall Solutions', tag: 'Safeguard the network perimeter',
      d: 'Next-generation firewalls built on Sophos XG Series — web filtering, application control, IPS, VPN and user-based policies, with managed 24/7 monitoring.', icon: '🛡️' }
  ],
  erpModules: [
    ['💰', 'Finance & Accounting', 'GL, AP/AR, multi-currency, P&L and cash-flow in one ledger.'],
    ['👥', 'HR & Payroll', 'Employee records, contracts, WPS-compliant payroll, leave.'],
    ['📈', 'Sales & CRM', 'Pipeline, quotations, win/loss and customer 360.'],
    ['📦', 'Inventory & Supply Chain', 'Multi-warehouse stock, replenishment, barcode.'],
    ['🏭', 'Manufacturing', 'BOM, work orders, MRP and shop-floor control.'],
    ['✅', 'Project Management', 'Tasks, timesheets, billing and profitability per project.'],
    ['🧾', 'UniVAT & e-invoicing', 'NBR-approved VAT module, UAE Peppol-ready.']
  ],
  industries: ['Retail & Distribution', 'Manufacturing / RMG', 'Healthcare (HMIS)', 'Education', 'Banking & Finance', 'Government', 'Logistics & Supply Chain', 'Agriculture'],
  partnerTiers: [
    { t: 'Authorized Reseller', req: 'Trade licence · office in territory · $25k annual commitment', margin: 'Standard trade margin', terms: '30-day credit (on approval)', best: 'New resellers & retailers' },
    { t: 'Premier Partner', req: 'Proven volume · certified staff', margin: 'Tiered volume margins', terms: 'Extended terms + MDF', best: 'Growing integrators' },
    { t: 'Elite Partner', req: 'Strategic territory coverage', margin: 'Best-tier margins + UniERP territory rights', terms: 'Custom agreement', best: 'Regional leaders' }
  ],
  blog: [
    ['Why Choose Authorized IT Distributors in UAE — Hidden Risks of Grey Market Hardware', 'CHANNEL'],
    ['Enterprise SSD Buying Guide 2026 — SAS vs NVMe vs SATA', 'STORAGE'],
    ['How UniERP Transforms SME Operations — a Real-World Implementation Story', 'SOFTWARE'],
    ['UAE Data Protection Law & Your IT Infrastructure — Are You Compliant?', 'COMPLIANCE'],
    ['DDR4 vs DDR5 — What Businesses Need to Know Before Upgrading', 'STORAGE'],
    ['The Rise of AI in ERP Systems — Hype vs Reality in 2026', 'SOFTWARE'],
    ['Cybersecurity Best Practices for UAE Businesses — a Practical Guide', 'SECURITY'],
    ['How to Build Future-Proof IT Infrastructure — Scalability, Security & Cost', 'INFRA'],
    ['Industry 4.0 — Manufacturing ERP Trends Transforming GCC Factories', 'MANUFACTURING'],
    ['Simal Technologies: 20+ Years of IT Excellence in the Middle East', 'COMPANY']
  ],
  cases: [
    ['IT Reseller Growth', '3× revenue in 18 months'],
    ['System Integrator', 'Enterprise project won with Simal support'],
    ['Government Entity', 'Transparent IT procurement'],
    ['Manufacturing (RMG)', 'Group ERP transformation'],
    ['Retail Chain', 'POS & inventory integration'],
    ['Healthcare', 'Hospital management system'],
    ['Education', 'K-12 digital campus'],
    ['Logistics', 'Fleet & 3PL optimization']
  ],
  leadership: [
    ['Chairman', 'Mohammad Mazharul Islam'],
    ['Managing Director', 'Mohammad Zahirul Islam'],
    ['Deputy Managing Director', 'S. M. Mohibul Hasan']
  ],
  mission: 'Empowering businesses with essential tools for a digital-first landscape through comprehensive technology distribution services.',
  vision: 'To be the premier IT solutions distributor — going beyond product delivery to empower businesses with innovative technology solutions.',
  values: [
    ['Service Excellence', 'Unmatched customer support and technical expertise'],
    ['Integrity & Authenticity', 'Genuine products, honest advice, transparent pricing'],
    ['Partnership Approach', 'Clients and vendors as long-term partners'],
    ['Regional Expertise', 'Deep understanding of MEA, CIS and GCC markets'],
    ['Continuous Innovation', 'Evolution from distributor to solution enabler']
  ],
  careerDepts: [
    ['Sales & Business Development', 'Account managers · inside sales · tender desk'],
    ['Product & Category Management', 'Brand owners for storage, components, accessories'],
    ['Supply Chain & Logistics', 'JAFZA warehouse · freight · customs'],
    ['Marketing', 'Channel campaigns · content · digital'],
    ['Finance & Administration', 'Credit control · AR/AP · payroll'],
    ['Customer Support', 'Order desk · RMA · after-sales'],
    ['Internships', 'Rotational graduate program'],
    ['Software Development — Dhaka', 'Odoo/UniERP engineers at the Unisoft delivery center']
  ],
  legal: ['Privacy Policy', 'Terms & Conditions', 'Cookie Policy', 'Return Policy', 'Shipping Policy', 'Refund Policy', 'Accessibility Statement'],

  /* ===== v1.0.6 deep-dive additions (precise, from content files) ===== */
  heroSlides: [
    { kick: 'PCIe Gen5 SSD Leadership · Dubai Hub', h: 'The Gen5 Era is Here. Breakthrough 14,500 MB/s.', s: 'Crucial T705 and P510 Gen5 NVMe SSDs engineered with Micron 232-layer 3D TLC NAND for extreme workstation and enterprise compute.', cta: 'Explore Gen5 SSDs', href: 'category.html#internal-ssd', slug: 'crucial-t705-ssd-2' },
    { kick: 'Enterprise Memory & Compute · Crucial & Samsung', h: 'Zero-Latency Compute. High-Density DDR5 Pro Memory.', s: 'Next-generation DDR5 UDIMM, SODIMM, and server memory modules up to 6000 MT/s. Certified reliability with lifetime warranty.', cta: 'View Memory Lines', href: 'category.html#memory', slug: 'crucial-overlocking-ddr5-pro-memory' },
    { kick: 'Rugged Extreme Portable SSDs · Crucial & Samsung', h: 'Indestructible Data Mobility. Shielded 2,100 MB/s Flash.', s: 'Crucial X10 Pro and Samsung T7 Shield portable SSDs with IP55/IP65 dust/water resistance and 2-meter drop durability for creative pros.', cta: 'Explore Portable SSDs', href: 'category.html#portable-ssd', slug: 'crucial-x10-pro-portable-ssd' },
    { kick: 'High-Performance Workstation Storage · Micron Engineered', h: 'Pro-Tier Gen4 Dominance. Breakthrough 7,400 MB/s.', s: 'Crucial T500 NVMe SSD with integrated low-profile heatsink engineered for demanding 4K/8K rendering, workstation loads, and console expansion.', cta: 'Explore Gen4 SSDs', href: 'category.html#internal-ssd', slug: 'crucial-t500-heatsink' },
    { kick: 'Authorized IT Distribution · 24 Years in MEA', h: 'The Middle East’s Trusted Channel Engine for Memory.', s: 'Direct authorized distribution for 23 global IT leaders. 100% serialized genuine stock fulfilled same-day from Dubai JAFZA bonded logistics.', cta: 'Become an Authorized Partner', href: 'onboarding.html', slug: 'crucial-t700-ssd-heatsink' }
  ],
  featured12: ['crucial-t500-heatsink', 'ugreen-5-in-1-usb-c-hub', 'koorui-27-inch-gaming-monitor', 'gtx1030-2gb-gddr5-64-bit-hdmi-dvi-vga', 'arktek-rtx3060-led-ga104-150-a1-3584sp-gddr6-12gb-13201777-12gbps_6b2aaad2', '1672', 'samsung-t7-shield-portable-ssd-1tb', 'dell-15-laptop', 'crucial-ddr4-pro-memory', 'aiwa-22-flat-slim-monitor-75hz-fhd-hdmivga-56x36x11-cm-black', 'kingston-xs1000-1tb-portable-ssd-red', 'crucial-t705-ssd-2'],
  brandRows: [
    ['Storage & Memory', ['Crucial', 'Hikvision', 'Samsung', 'Kingston', 'SanDisk', 'WD', 'TeamGroup', 'Toshiba']],
    ['Graphics & Components', ['Arktek', 'MSI', 'Zotac', 'PNY']],
    ['Computing', ['Dell', 'HP', 'Lenovo']],
    ['Accessories & Displays', ['UGREEN', 'Honeywell', 'KOORUI', 'Aiwa', 'Nearity']]
  ],
  brandInfo: {
    crucial: ['Fuel Your System Performance.', 'The consumer brand of Micron Technology — SSDs and memory designed, manufactured and tested end-to-end by one of the world\u2019s largest semiconductor makers.'],
    hikvision: ['Intelligent Storage. Enterprise Trust.', 'HIKVISION / HIKSEMi surveillance and storage — high-performance SSDs with advanced thermal design, backed by enterprise-grade reliability.'],
    samsung: ['World\u2019s #1 Flash Memory.', 'Samsung portable SSDs and memory — the flash pioneer behind the T7 Shield\u2019s rugged, high-speed external storage.'],
    kingston: ['Memory Made Reliable.', 'The world\u2019s largest independent memory manufacturer — XS1000 pocket SSDs and trusted DRAM.'],
    sandisk: ['Capture. Store. Trust.', 'SanDisk flash storage — decades of memory innovation for creators and enterprises.'],
    wd: ['Powering the World\u2019s Data Infrastructure.', 'Western Digital storage platforms from client to data center.'],
    teamgroup: ['Memory of Lifetime.', 'TEAMGROUP DDR memory and T-FORCE gaming lines — award-winning partner 2025.'],
    toshiba: ['Committed to People, Committed to the Future.', 'Toshiba portable hard drives — proven rotational storage for backup archives.'],
    arktek: ['Powering Every Pixel.', 'ARKTEK graphics cards — GT to RTX class gaming GPUs for the channel.'],
    msi: ['True Gaming. True Quality.', 'MSI gaming components and systems — a global esports flagship.'],
    zotac: ['Push the Limit.', 'ZOTAC graphics cards and mini PCs — compact computing pioneers.'],
    pny: ['Performance Without Compromise.', 'PNY memory and flash — professional-grade storage made in-house.'],
    dell: ['Powering Business. Engineered for Reliability.', 'Dell business laptops and desktops — the enterprise standard.'],
    hp: ['Innovation That Inspires.', 'HP premium computing and printing for business.'],
    lenovo: ['World\u2019s #1 PC. Smart Innovation.', 'Lenovo ThinkPad/ideaPad lines and enterprise computing.'],
    ugreen: ['Redefining Connectivity.', 'UGREEN hubs, docks, cables and chargers — sleek, versatile solutions for every device.'],
    honeywell: ['Protected Power. Trusted Globally.', 'Honeywell surge protectors and power — X3 MOV safety engineering.'],
    koorui: ['Your Game. Your Vision.', 'KOORUI gaming and professional monitors — high-refresh panels, official UAE distribution.'],
    aiwa: ['Clarity. Performance. Brilliance.', 'Aiwa flat & slim monitors bringing every frame to life.'],
    nearity: ['Transform Your Meetings.', 'Nearity all-in-one conference solutions — the AV flagship of our solutions practice.']
  },
  amcTiers: {
    head: ['Feature', 'Basic', 'Standard', 'Premium'],
    rows: [
      ['Response time', 'Next business day', '4 hours', '1 hour'],
      ['Resolution time', '48 hours', '8 hours', '4 hours'],
      ['Support hours', 'Sun–Thu 9–18', 'Sun–Thu 8–20', '24×7×365'],
      ['On-site visits', '4 / year (quarterly)', '12 / year (monthly)', 'Unlimited'],
      ['Remote support', 'Email & phone', '+ remote desktop', 'All + dedicated engineer']
    ]
  },
  erpPricing: [
    { t: 'Starter', best: 'Small businesses (11–50 staff) moving off spreadsheets', impl: '8–10 weeks', users: 'Unlimited' },
    { t: 'Professional', best: 'Growing companies (51–500 staff) needing full ERP', impl: '12–16 weeks', users: 'Unlimited' },
    { t: 'Enterprise', best: 'Large organizations (500+) with complex needs', impl: '18–24 weeks', users: 'Unlimited' }
  ],
  implPhases: [
    ['1 · Discovery', 'Weeks 1–2'], ['2 · Solution design', 'Week 3'], ['3 · Configuration & development', 'Weeks 4–6'],
    ['4 · Testing', 'Weeks 7–8'], ['5 · Training', 'Weeks 9–10'], ['6 · Go-live', 'Week 11'], ['7 · Ongoing support', 'Week 12+']
  ],
  offices: [
    ['Dubai Headquarters (Corporate Office)', 'Office 201, Dar Al Riffa Bldg, Khalid Bin Al Waleed Rd, Bur Dubai, PO Box 49740', '+971 4 393 0507 · +971 50 848 7861 · info@simalme.com', 'Landmark: Al Fahidi Metro (Green Line), 5 min walk'],
    ['Warehouse & Logistics Center (JAFZA)', 'StarSeed Technologies ME FZE, RA08DA07, Jebel Ali Free Zone, Dubai', 'Channel fulfilment · GCC & MEA dispatch', 'Import/export and bonded operations'],
    ['Retail Store (Bur Dubai)', 'Stellent Technologies ME LLC, Bur Dubai', '+971 4 393 0507', 'Walk-in retail and pickup'],
    ['Software Development Center (Dhaka)', 'UniSoft Systems Limited, Dhaka, Bangladesh', '40+ engineers · Odoo-certified', 'UniERP delivery for the partnership']
  ],
  jobs: [
    ['UAE-001', 'Senior B2B Sales Executive — IT Hardware', 'Sales & BD', '3–5 yrs'],
    ['UAE-002', 'Key Account Manager — GCC Region', 'Sales & BD', '5+ yrs'],
    ['UAE-003', 'Channel Sales Manager — SMB Segment', 'Sales & BD', '4–7 yrs'],
    ['UAE-004', 'Product Manager — Storage & Memory', 'Product', '3–5 yrs'],
    ['UAE-005', 'Category Specialist — Networking & Surveillance', 'Product', '2–4 yrs'],
    ['UAE-006', 'Procurement Officer — IT Hardware', 'Supply Chain', '2–4 yrs'],
    ['UAE-007', 'Logistics Coordinator — Import/Export', 'Supply Chain', '2–5 yrs'],
    ['UAE-008', 'Digital Marketing Specialist', 'Marketing', '2–4 yrs'],
    ['UAE-009', 'Content Writer — B2B Technology', 'Marketing', '2–3 yrs'],
    ['UAE-010', 'SEO Specialist', 'Marketing', '2–4 yrs'],
    ['UAE-011', 'Senior Accountant', 'Finance', '3–5 yrs'],
    ['UAE-012', 'HR & Admin Coordinator', 'HR & Admin', '2–4 yrs']
  ],
  counters: [['20+', 'Years · since 2002'], ['300+', 'Team members'], ['23', 'Authorized brands'], ['81', 'Live SKUs'], ['6', 'Regions served']]
};
