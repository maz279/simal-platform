// seed_cms_blocks.mjs
import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: (() => { if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)'); return process.env.DATABASE_URL; })()
});

async function run() {
  await client.connect();

  const featSlugs = [
    'crucial-t500-heatsink',
    'ugreen-5-in-1-usb-c-hub',
    'koorui-27-inch-gaming-monitor',
    'gtx1030-2gb-gddr5-64-bit-hdmi-dvi-vga',
    'arktek-rtx3060-led-ga104-150-a1-3584sp-gddr6-12gb-13201777-12gbps_6b2aaad2',
    '1672',
    'samsung-t7-shield-portable-ssd-1tb',
    'dell-15-laptop-14th-gen-intel-core-3',
    'crucial-ddr4-pro-memory',
    'aiwa-22-flat-slim-monitor-75hz-fhd-hdmivga-56x36x11-cm-black',
    'kingston-xs1000-1tb-portable-ssd-red',
    'crucial-t705-ssd-2'
  ];

  await client.query(`
    INSERT INTO content_blocks (entity, entity_id, lang, payload, updated_by, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (entity, entity_id, lang)
    DO UPDATE SET payload = $4, updated_at = $6
  `, ['site', 'featured-products', 'en', JSON.stringify({ slugs: featSlugs }), 'system', Date.now()]);

  const roles = [
    { code: 'UAE-001', title: 'Senior B2B Sales Executive — IT Hardware', dept: 'Sales & BD', exp: '3–5 yrs', icon: '📈' },
    { code: 'UAE-002', title: 'Key Account Manager — GCC Region', dept: 'Sales & BD', exp: '5+ yrs', icon: '📈' },
    { code: 'UAE-004', title: 'Product Manager — Storage & Memory', dept: 'Product', exp: '3–5 yrs', icon: '🏷️' },
    { code: 'UAE-007', title: 'Logistics Coordinator — Import/Export', dept: 'Supply Chain', exp: '2–5 yrs', icon: '🚚' }
  ];

  await client.query(`
    INSERT INTO content_blocks (entity, entity_id, lang, payload, updated_by, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (entity, entity_id, lang)
    DO UPDATE SET payload = $4, updated_at = $6
  `, ['site', 'careers-roles', 'en', JSON.stringify(roles), 'system', Date.now()]);

  console.log('Seeded featured-products and careers-roles successfully!');
  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
