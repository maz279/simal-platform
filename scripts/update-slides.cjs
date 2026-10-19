const pg = require('pg');

async function update() {
  const client = new pg.Client({ connectionString: (() => { if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)'); return process.env.DATABASE_URL; })() });
  await client.connect();

  const slides = [
    {
      idx: 1,
      kick: 'PCIe Gen5 SSD Leadership · Dubai Hub',
      headline: 'The Gen5 Era is Here. Breakthrough 14,500 MB/s.',
      sub: 'Crucial T705 and P510 Gen5 NVMe SSDs engineered with Micron 232-layer 3D TLC NAND for extreme workstation and enterprise compute.',
      cta_label: 'Explore Gen5 SSDs',
      cta_href: '/products#internal-ssd',
      photo_slug: 'crucial-t705-ssd-2',
      motif: 'grid',
      active: true
    },
    {
      idx: 2,
      kick: 'Enterprise Memory & Compute · Crucial & Samsung',
      headline: 'Zero-Latency Compute. High-Density DDR5 Pro Memory.',
      sub: 'Next-generation DDR5 UDIMM, SODIMM, and server memory modules up to 6000 MT/s. Certified reliability with lifetime warranty.',
      cta_label: 'View Memory Lines',
      cta_href: '/products#memory',
      photo_slug: 'crucial-overlocking-ddr5-pro-memory',
      motif: 'arcs',
      active: true
    },
    {
      idx: 3,
      kick: 'Rugged Extreme Portable SSDs · Crucial & Samsung',
      headline: 'Indestructible Data Mobility. Shielded 2,100 MB/s Flash.',
      sub: 'Crucial X10 Pro and Samsung T7 Shield portable SSDs with IP55/IP65 dust/water resistance and 2-meter drop durability for creative pros.',
      cta_label: 'Explore Portable SSDs',
      cta_href: '/products#portable-ssd',
      photo_slug: 'crucial-x10-pro-portable-ssd',
      motif: 'rings',
      active: true
    },
    {
      idx: 4,
      kick: 'High-Performance Workstation Storage · Micron Engineered',
      headline: 'Pro-Tier Gen4 Dominance. Breakthrough 7,400 MB/s.',
      sub: 'Crucial T500 NVMe SSD with integrated low-profile heatsink engineered for demanding 4K/8K rendering, workstation loads, and console expansion.',
      cta_label: 'Explore Gen4 SSDs',
      cta_href: '/products#internal-ssd',
      photo_slug: 'crucial-t500-heatsink',
      motif: 'dots',
      active: true
    },
    {
      idx: 5,
      kick: 'Authorized IT Distribution · 24 Years in MEA',
      headline: 'The Middle East’s Trusted Channel Engine for Memory.',
      sub: 'Direct authorized distribution for 23 global IT leaders. 100% serialized genuine stock fulfilled same-day from Dubai JAFZA bonded logistics.',
      cta_label: 'Become an Authorized Partner',
      cta_href: '/onboarding',
      photo_slug: 'crucial-t700-ssd-heatsink',
      motif: 'grid',
      active: true
    }
  ];

  for (const s of slides) {
    await client.query(
      `INSERT INTO hero_slides (idx, kick, headline, sub, cta_label, cta_href, photo_slug, motif, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (idx) DO UPDATE SET
         kick = EXCLUDED.kick,
         headline = EXCLUDED.headline,
         sub = EXCLUDED.sub,
         cta_label = EXCLUDED.cta_label,
         cta_href = EXCLUDED.cta_href,
         photo_slug = EXCLUDED.photo_slug,
         motif = EXCLUDED.motif,
         active = EXCLUDED.active`,
      [s.idx, s.kick, s.headline, s.sub, s.cta_label, s.cta_href, s.photo_slug, s.motif, s.active]
    );
  }

  const res = await client.query('SELECT idx, kick, headline, photo_slug FROM hero_slides ORDER BY idx');
  console.log('Successfully updated hero_slides in PostgreSQL:');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
