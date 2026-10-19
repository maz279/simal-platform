/* ==========================================================================
 * cms.service.js — T4.1: CMS module for content_blocks, hero_slides, legal_policies.
 * Role-gated (`notes` perm). Every write creates a revision entry.
 * Publish triggers a purge event (ADR-13) that the SSG build listens for.
 * ========================================================================== */
import { HttpError } from '../lib/http.js';
import { createNotify } from './notify.service.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createCmsService(repos) {
  const client = repos.client;
  /* rm(7.3): approval/override notifications (same stateless repos-based seam as server.js) */
  const notify = createNotify(repos);

  const getActor = (s) => s?.user?.email || s?.email || s?.user?.name || s?.name || 'system';

  function parseContentBlockKey(key) {
    const str = String(key || '');
    if (str.includes(':')) {
      const parts = str.split(':');
      return { entity: parts[0], entityId: parts[1], lang: parts[2] || 'en' };
    }
    if (str.includes('/')) {
      const parts = str.split('/');
      return { entity: parts[0], entityId: parts[1], lang: parts[2] || 'en' };
    }
    return { entity: null, entityId: str, lang: 'en' };
  }

  /* ---- revision tracking ---- */
  async function saveRevision(table, id, payload, actor) {
    await client.query(
      `INSERT INTO cms_revisions (table_name, record_id, payload, actor, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [table, String(id), JSON.stringify(payload), actor, Date.now()]
    );
  }

  /* ---- content_blocks CRUD ---- */
  async function listBlocks(entity) {
    const r = await client.query(
      entity
        ? 'SELECT id, entity, entity_id, lang, payload, updated_by, updated_at FROM content_blocks WHERE entity = $1 ORDER BY entity_id'
        : 'SELECT id, entity, entity_id, lang, payload, updated_by, updated_at FROM content_blocks ORDER BY entity, entity_id',
      entity ? [entity] : []
    );
    return r.rows;
  }

  async function getBlock(entity, entityId, lang = 'en') {
    const r = await client.query(
      'SELECT * FROM content_blocks WHERE entity = $1 AND entity_id = $2 AND lang = $3',
      [entity, entityId, lang]
    );
    return r.rows[0] || null;
  }

  async function upsertBlock({ entity, entityId, lang = 'en', payload }, session) {
    if (!entity || !entityId) throw new HttpError(422, 'entity and entityId are required');
    if (payload === undefined || payload === null) throw new HttpError(422, 'payload is required');
    assertSafeBlockPayload(payload); // rm(9.2-2)/F-2026-N10: no stored javascript:/data://* URLs, at any depth
    const existing = await getBlock(entity, entityId, lang);
    const actor = getActor(session);
    const compoundKey = `${entity}:${entityId}:${lang}`;
    if (existing) {
      await saveRevision('content_blocks', compoundKey, existing.payload, actor);
      await client.query(
        'UPDATE content_blocks SET payload = $1, updated_by = $2, updated_at = $3 WHERE id = $4',
        [JSON.stringify(payload), actor, Date.now(), existing.id]
      );
    } else {
      await client.query(
        'INSERT INTO content_blocks (entity, entity_id, lang, payload, updated_by, updated_at) VALUES ($1,$2,$3,$4,$5,$6)',
        [entity, entityId, lang, JSON.stringify(payload), actor, Date.now()]
      );
    }
    await repos.audit(actor, 'cms_block_upserted', `${entity}/${entityId}`, '');
    return getBlock(entity, entityId, lang);
  }

  async function deleteBlock(entity, entityId, session) {
    const lang = 'en';
    const existing = await getBlock(entity, entityId, lang);
    if (!existing) throw new HttpError(404, 'Block not found');
    const actor = getActor(session);
    const compoundKey = `${entity}:${entityId}:${lang}`;
    await saveRevision('content_blocks', compoundKey, existing.payload, actor);
    await client.query('DELETE FROM content_blocks WHERE id = $1', [existing.id]);
    await repos.audit(actor, 'cms_block_deleted', `${entity}/${entityId}`, '');
    return { deleted: true };
  }

  /* ---- hero_slides CRUD ---- */
  async function listSlides() {
    const r = await client.query('SELECT * FROM hero_slides ORDER BY idx');
    return r.rows;
  }

  /* rm(4.5-2): product category taxonomy — list w/ usage counts + guarded rename */
  async function listCategories() {
    const r = await client.query(
      "SELECT cat, cat_label, count(*)::int AS n FROM products GROUP BY cat, cat_label ORDER BY cat"
    );
    return r.rows.map((row) => ({ cat: row.cat, label: row.cat_label || row.cat, count: row.n }));
  }

  async function renameCategory(fromCat, { cat, cat_label }, session) {
    if (!fromCat) throw new HttpError(422, 'fromCat is required');
    /* deploy-audit D22: the #/categories editor renames the LABEL and posts only { cat_label };
     * the slug was derived from the absent cat, so every rename failed with 422. An omitted
     * cat keeps the slug (label-only rename); a given cat also moves the products' slug. */
    const toCat = String(cat === undefined || cat === null || cat === '' ? fromCat : cat).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const label = String(cat_label || toCat).trim().slice(0, 60);
    if (!toCat) throw new HttpError(422, 'cat is required');
    if (!label) throw new HttpError(422, 'cat_label is required');
    const actor = getActor(session);
    await client.query('UPDATE products SET cat = $1, cat_label = $2, updated_at = $3 WHERE cat = $4', [toCat, label, Date.now(), fromCat]);
    await repos.audit(actor, 'cms_category_renamed', fromCat, toCat + ' (' + label + ')');
    return { renamed: fromCat, to: toCat, label };
  }

  /* rm(3.2-2) / F-2026-N10: stored public URLs must be relative paths or http(s)/mailto/tel —
   * a javascript:/data: href can never be persisted for the site to render.
   * rm(9.2-2): tightened to the roadmap SAFE_URL — protocol-relative //host and /\host
   * (both resolve to an external origin) and control-char scheme smuggling are refused. */
  const SAFE_URL = /^(?:\/(?![\/\\])|#[\w-]*$|https?:\/\/|mailto:|tel:)/i;
  function assertSafePublicUrl(raw, field) {
    const v = String(raw ?? '').trim();
    if (v && (/[\u0000-\u001F\u007F]/.test(v) || !SAFE_URL.test(v))) {
      throw new HttpError(422, field + ' must be a same-site path, #anchor, or http(s)/mailto/tel URL');
    }
    return v;
  }

  /* rm(9.2-2)/F-2026-N10: blocks are free-form JSON, so EVERY stored public URL inside a
   * payload is validated — any key matching /href|url|link/i, recursively, plus insight
   * CTA arrays (payload.cta = [label, href]). Roadmap 3.2-2 write-path table. */
  function assertSafeBlockPayload(payload, path = 'payload') {
    if (Array.isArray(payload)) {
      payload.forEach((v, i) => assertSafeBlockPayload(v, path + '[' + i + ']'));
    } else if (payload && typeof payload === 'object') {
      for (const [k, v] of Object.entries(payload)) {
        if (typeof v === 'string' && /href|url|link/i.test(k)) assertSafePublicUrl(v, path + '.' + k);
        else if (k === 'cta' && Array.isArray(v) && typeof v[1] === 'string') assertSafePublicUrl(v[1], path + '.cta[1]');
        else assertSafeBlockPayload(v, path + '.' + k);
      }
    }
  }

  /* rm(6.3-2)/F-2026-N16: hero_slides.bg is rendered into a style attribute — only the
   * strict whitelist may persist (relative image asset path, hex color, or a simple
   * linear/radial gradient). Empty clears it. Anything else is a 422, never stored. */
  function assertValidSlideBg(raw) {
    const v = String(raw ?? '').trim();
    if (v === '') return;
    const ok = /^\/[\w\/.-]+\.(?:jpe?g|png|webp|avif)$/i.test(v)
      || /^(?:#[0-9a-f]{3,8}|(?:linear|radial)-gradient\([#\w\s.,%()-]+\))$/i.test(v);
    if (!ok) throw new HttpError(422, 'bg must be empty, a relative image path (/assets/img/x.webp), a hex color, or a simple linear/radial gradient');
  }

  async function upsertSlide(slide, session) {
    assertSafePublicUrl(slide && slide.cta_href, 'cta_href');
    const { idx, kick, headline, sub, cta_label, cta_href, photo_slug, bg, motif, active } = slide;
    if (!idx || !headline || !cta_label || !cta_href) throw new HttpError(422, 'idx, headline, cta_label, cta_href are required');
    assertValidSlideBg(bg);
    const existing = await client.query('SELECT * FROM hero_slides WHERE idx = $1', [idx]);
    const slideBg = bg !== undefined ? bg : (existing.rows[0]?.bg || '');
    if (existing.rows[0]) {
      await saveRevision('hero_slides', String(idx), existing.rows[0], (session?.user?.email || 'system'));
      await client.query(
        `UPDATE hero_slides SET kick=$1, headline=$2, sub=$3, cta_label=$4, cta_href=$5, photo_slug=$6, bg=$7, motif=$8, active=$9 WHERE idx=$10`,
        [kick, headline, sub, cta_label, cta_href, photo_slug, slideBg, motif, active ?? true, idx]
      );
    } else {
      await client.query(
        `INSERT INTO hero_slides (idx, kick, headline, sub, cta_label, cta_href, photo_slug, bg, motif, active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [idx, kick, headline, sub, cta_label, cta_href, photo_slug, slideBg, motif, active ?? true]
      );
    }
    await repos.audit((session?.user?.email || 'system'), 'cms_slide_upserted', `slide-${idx}`, headline);
    return (await client.query('SELECT * FROM hero_slides WHERE idx = $1', [idx])).rows[0];
  }

  async function deleteSlide(idx, session) {
    const existing = await client.query('SELECT * FROM hero_slides WHERE idx = $1', [idx]);
    if (!existing.rows[0]) throw new HttpError(404, 'Slide not found');
    await saveRevision('hero_slides', String(idx), existing.rows[0], (session?.user?.email || 'system'));
    await client.query('DELETE FROM hero_slides WHERE idx = $1', [idx]);
    await repos.audit((session?.user?.email || 'system'), 'cms_slide_deleted', `slide-${idx}`, '');
    return { deleted: true };
  }

  /* ---- legal_policies CRUD ---- */
  async function listPolicies() {
    const r = await client.query('SELECT slug, title, body, lang, version, updated_at FROM legal_policies ORDER BY slug');
    return r.rows;
  }

  /* deploy-audit D06 (roadmap L-02): legal_policies is keyed (slug, lang) and the site
   * renders /legal/<slug> from the en row and /ar/legal/<slug> from the ar row. Every read,
   * write, revision and rollback used to filter on slug alone, so saving one language
   * overwrote BOTH rows' title and body. Revisions are now keyed 'slug:lang'. */
  const policyLang = (lang) => {
    const l = String(lang || 'en').toLowerCase();
    if (l !== 'en' && l !== 'ar') throw new HttpError(422, "lang must be 'en' or 'ar'");
    return l;
  };
  const policyKey = (slug, lang) => `${slug}:${lang}`;
  const parsePolicyKey = (key) => {
    const k = String(key || '');
    const i = k.lastIndexOf(':');
    return i > 0 && /^(en|ar)$/.test(k.slice(i + 1)) ? { slug: k.slice(0, i), lang: k.slice(i + 1) } : { slug: k, lang: 'en' };
  };

  async function getPolicy(slug, lang = 'en') {
    const r = await client.query('SELECT * FROM legal_policies WHERE slug = $1 AND lang = $2', [slug, policyLang(lang)]);
    return r.rows[0] || null;
  }

  async function upsertPolicy({ slug, title, body, lang = 'en' }, session) {
    if (!slug || !title || !body) throw new HttpError(422, 'slug, title, body are required');
    const l = policyLang(lang);
    const existing = await getPolicy(slug, l);
    if (existing) {
      await saveRevision('legal_policies', policyKey(slug, l), existing, (session?.user?.email || 'system'));
      await client.query(
        'UPDATE legal_policies SET title=$1, body=$2, version=version+1, updated_at=$3 WHERE slug=$4 AND lang=$5',
        [title, body, Date.now(), slug, l]
      );
    } else {
      await client.query(
        'INSERT INTO legal_policies (slug, title, body, lang, version, updated_at) VALUES ($1,$2,$3,$4,1,$5)',
        [slug, title, body, l, Date.now()]
      );
    }
    await repos.audit((session?.user?.email || 'system'), 'cms_policy_upserted', policyKey(slug, l), title);
    return getPolicy(slug, l);
  }

  /* ---- revision history ---- */
  async function listRevisions(tableName, recordId) {
    if (tableName === 'legal_policies') {
      /* deploy-audit D06: 'slug:lang'. Legacy snapshots were saved under the bare slug and
       * hold whichever language row was read — match them by the lang inside the snapshot,
       * so an Arabic snapshot is never offered as an English rollback (or vice versa). */
      const { slug, lang } = parsePolicyKey(recordId);
      const r = await client.query(
        `SELECT * FROM cms_revisions WHERE table_name = 'legal_policies'
           AND (record_id = $1 OR (record_id = $2 AND payload::jsonb->>'lang' = $3))
         ORDER BY created_at DESC LIMIT 10`,
        [policyKey(slug, lang), slug, lang]
      );
      return r.rows;
    }
    if (tableName === 'content_blocks') {
      const parsed = parseContentBlockKey(String(recordId));
      if (parsed.entity) {
        const fullKey = `${parsed.entity}:${parsed.entityId}:${parsed.lang}`;
        const r = await client.query(
          'SELECT * FROM cms_revisions WHERE table_name = $1 AND record_id = $2 ORDER BY created_at DESC LIMIT 10',
          [tableName, fullKey]
        );
        if (r.rows.length) return r.rows;
      }
      const r = await client.query(
        'SELECT * FROM cms_revisions WHERE table_name = $1 AND (record_id = $2 OR record_id LIKE $3) ORDER BY created_at DESC LIMIT 10',
        [tableName, String(recordId), `%:${recordId}:%`]
      );
      return r.rows;
    }
    const r = await client.query(
      'SELECT * FROM cms_revisions WHERE table_name = $1 AND record_id = $2 ORDER BY created_at DESC LIMIT 10',
      [tableName, String(recordId)]
    );
    return r.rows;
  }

  async function rollback(tableName, recordId, session, { revisionId } = {}) {
    const revisions = await listRevisions(tableName, recordId);
    if (!revisions.length) throw new HttpError(404, 'No revisions found');
    /* rm(10.3-1 pen): the revision table offers one rollback button PER snapshot, but
     * the API ignored the selection and always restored the newest. Honour the id. */
    const target = revisionId
      ? revisions.find((r) => String(r.id) === String(revisionId))
      : revisions[0];
    if (!target) throw new HttpError(404, 'Revision not found for this record');
    const payload = typeof target.payload === 'string' ? JSON.parse(target.payload) : target.payload;
    const actor = getActor(session);
    const rollbackActor = actor.includes('rollback') ? actor : `${actor} (rollback)`;

    // 1. Snapshot CURRENT state first so this rollback is itself undoable!
    if (tableName === 'content_blocks') {
      let ent = null, eId = null, lng = 'en';
      if (target.record_id && target.record_id.includes(':')) {
        const p = target.record_id.split(':');
        ent = p[0]; eId = p[1]; lng = p[2] || 'en';
      } else {
        const parsed = parseContentBlockKey(String(recordId));
        ent = parsed.entity; eId = parsed.entityId; lng = parsed.lang;
      }
      if (!ent) {
        const matches = (await client.query('SELECT * FROM content_blocks WHERE entity_id = $1', [eId])).rows;
        if (matches.length === 1) {
          ent = matches[0].entity;
          lng = matches[0].lang;
        } else if (matches.length > 1) {
          throw new HttpError(400, `Ambiguous content block '${eId}' across ${matches.length} entities. Use entity:entity_id:lang.`);
        }
      }
      const cur = ent ? await getBlock(ent, eId, lng) : null;
      if (cur) {
        await saveRevision('content_blocks', `${ent}:${eId}:${lng}`, cur.payload, rollbackActor);
      }
      await client.query(
        'UPDATE content_blocks SET payload = $1, updated_by = $2, updated_at = $3 WHERE entity = $4 AND entity_id = $5 AND lang = $6',
        [JSON.stringify(payload), actor, Date.now(), ent, eId, lng]
      );
    } else if (tableName === 'hero_slides') {
      const idx = parseInt(recordId, 10);
      const cur = (await client.query('SELECT * FROM hero_slides WHERE idx = $1', [idx])).rows[0];
      if (cur) await saveRevision('hero_slides', String(idx), cur, rollbackActor);
      const s = payload;
      assertSafePublicUrl(s && s.cta_href, 'cta_href'); // rm(9.2-2): rollback restores cta_href unchecked — validate before UPDATE
      await client.query(
        `UPDATE hero_slides SET kick=$1, headline=$2, sub=$3, cta_label=$4, cta_href=$5, photo_slug=$6, bg=$7, motif=$8, active=$9 WHERE idx=$10`,
        [s.kick, s.headline, s.sub, s.cta_label, s.cta_href, s.photo_slug, s.bg, s.motif, s.active, idx]
      );
    } else if (tableName === 'legal_policies') {
      /* deploy-audit D06: one language only ('slug:lang'; a bare slug is the legacy en key) */
      const { slug: pslug, lang: plang } = parsePolicyKey(recordId);
      const cur = (await client.query('SELECT * FROM legal_policies WHERE slug = $1 AND lang = $2', [pslug, plang])).rows[0];
      if (cur) await saveRevision('legal_policies', policyKey(pslug, plang), cur, rollbackActor);
      await client.query('UPDATE legal_policies SET title=$1, body=$2, updated_at=$3 WHERE slug=$4 AND lang=$5',
        [payload.title, payload.body, Date.now(), pslug, plang]);
    } else if (tableName === 'announcements') {
      const id = parseInt(recordId, 10);
      const cur = (await client.query('SELECT * FROM announcements WHERE id = $1', [id])).rows[0];
      if (cur) await saveRevision('announcements', String(id), cur, rollbackActor);
      await client.query(
        'UPDATE announcements SET text = $1, cta_href = $2, cta_label = $3, active = $4 WHERE id = $5',
        [payload.text, assertSafePublicUrl(payload.cta_href || '', 'cta_href'), payload.cta_label || 'See the SKU & RFQ channel pricing →', payload.active, id]
      );
    } else if (tableName === 'testimonials') {
      const id = parseInt(recordId, 10);
      const cur = (await client.query('SELECT * FROM testimonials WHERE id = $1', [id])).rows[0];
      if (cur) await saveRevision('testimonials', String(id), cur, rollbackActor);
      await client.query(
        'UPDATE testimonials SET quote = $1, name = $2, role = $3, company = $4, active = $5 WHERE id = $6',
        [payload.quote, payload.name, payload.role || '', payload.company || null, payload.active, id]
      );
    } else if (tableName === 'products') {
      const cur = await getProduct(recordId);
      if (cur) await saveRevision('products', String(recordId), cur, rollbackActor);
      const p = payload;
      await client.query(
        'UPDATE products SET sku=$1, name=$2, brand=$3, cat=$4, cat_label=$5, descr=$6, short=$7, specs=$8, imgs=$9, stock=$10, is_new=$11, updated_at=$12 WHERE slug=$13',
        [p.sku, p.name, normBrand(p.brand), p.cat, p.cat_label || p.catLabel, p.descr, p.short,
         JSON.stringify(p.specs || {}), JSON.stringify(p.imgs || []), p.stock === true || p.stock === 'true' || p.stock === 1 || p.stock === '1', p.is_new ?? false, Date.now(), String(recordId)]
      );
    } else if (tableName === 'brands') {
      /* deploy-audit D07: brand and product_deep snapshots were saved and the brand editor
       * offers Rollback, but no branch restored them — the API answered rolled_back:true
       * having changed nothing. */
      const cur = (await client.query('SELECT * FROM brands WHERE slug = $1', [String(recordId)])).rows[0];
      if (!cur) throw new HttpError(404, 'Brand not found');
      await saveRevision('brands', String(recordId), cur, rollbackActor);
      const counts = payload.counts == null ? null : (typeof payload.counts === 'string' ? payload.counts : JSON.stringify(payload.counts));
      await client.query('UPDATE brands SET name=$1, counts=$2, line=$3, note=$4, updated_at=$5 WHERE slug=$6',
        [payload.name || cur.name, counts, payload.line ?? null, payload.note ?? null, Date.now(), String(recordId)]);
    } else if (tableName === 'product_deep') {
      const cur = (await client.query('SELECT * FROM product_deep WHERE slug = $1', [String(recordId)])).rows[0];
      if (!cur) throw new HttpError(404, 'Product detail not found');
      await saveRevision('product_deep', String(recordId), formatProductDeep(cur), rollbackActor);
      const j = (v, d) => (v == null ? d : (typeof v === 'string' ? v : JSON.stringify(v)));
      await client.query('UPDATE product_deep SET hero=$1, specs=$2, feats=$3, use_cases=$4, box=$5, docs=$6, updated_at=$7 WHERE slug=$8',
        [payload.hero || '', j(payload.specs, '{}'), j(payload.feats, '[]'), j(payload.use_cases, '[]'), j(payload.box, '[]'), j(payload.docs, '{}'), Date.now(), String(recordId)]);
    } else if (tableName !== 'content_blocks') {
      throw new HttpError(400, `Rollback is not supported for '${tableName}'`);
    }
    await repos.audit(actor, 'cms_rollback', `${tableName}/${recordId}`, 'Rolled back to previous revision');
    return { ok: true, rolled_back: true, to: target.created_at };
  }

  /* ---- rm(7.3): dual approval on the SERVER-DERIVED dirty set (SEC-11 residue) ----
   * Sensitivity is NEVER taken from caller-declared `entities` — the old attested
   * path let any reviewer ship unapproved edits by declaring site/all (and edits are
   * written live at save time, so a publish ships everything). The dirty set is every
   * cms_* content change since the last completed SSG build, read from the audit log —
   * the same source of truth the pipeline already writes. */

  /* Everything changed since the last processed build (publish events are not
   * content changes). Returns { items, maxAuditTs } — maxAuditTs makes an
   * approval's coverage one-shot against later edits of the same keys. */
  async function dirtySet() {
    const r = await client.query(`
      SELECT action, target, ts FROM audit_log
       WHERE action LIKE 'cms\\_%'
         AND action NOT IN ('cms_published', 'cms_emergency_publish', 'cms_emergency_override', 'cms_publish_retried', 'cms_publish_approval_requested', 'cms_approval_granted', 'cms_approval_rejected')  -- approval bookkeeping is not a content change
         AND ts > COALESCE((SELECT MAX(ts) FROM audit_log WHERE action = 'ssg_build_completed'), 0)
       ORDER BY ts`);
    const items = [...new Set(r.rows.map((row) => changeKey(row.action, row.target)).filter(Boolean))].sort();
    return { items, maxAuditTs: r.rows.reduce((m, row) => Math.max(m, Number(row.ts) || 0), 0) };
  }

  /* Extracted enqueue (was inline in publish) — the only path that may create an
   * ssg-builder outbox row for a publish. */
  async function enqueuePublish(entities, options = {}, actor = 'system', note = '') {
    const purgeAll = options.purgeAll === true; // rm(5.1-2): real semantic — full-site purge + full rebuild
    // rm(6.2-2): normalize entity descriptors so audit trails never record synthetic paths like
    // dist/insights/undefined. Accepts strings ('insight') or objects ({entity, entity_id});
    // id-less or 'all' scopes purge the section root; the 'site' scope purges the dist root.
    const toPurgePath = (e) => {
      const en = typeof e === 'string' ? e : (e && e.entity) || '';
      const id = e && typeof e === 'object' ? (e.entity_id || e.entityId || e.id || '') : '';
      if (!en) return null;
      const section = en === 'insight' ? 'insights' : en === 'it_solution' ? 'solutions' : en;
      if (section === 'site' || !id || id === 'all') return section === 'site' ? 'dist/' : `dist/${section}/`;
      return `dist/${section}/${id}`;
    };
    const event = {
      type: 'cms_publish',
      entities,
      actor,
      ts: Date.now(),
      purgeAll,
      purge: purgeAll ? ['dist/'] : (entities || []).map(toPurgePath).filter(Boolean),
    };
    const outboxId = `pub_${Date.now()}`;
    await client.query(
      'INSERT INTO outbox (id, channel, to_addr, subject, body, status, meta, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [outboxId, 'cms', 'ssg-builder', 'publish', JSON.stringify(event), 'queued', JSON.stringify({ event: 'cms.publish' }), Date.now()]
    );
    await repos.audit(actor, 'cms_published', (entities || []).map(e => typeof e === 'string' ? e : `${e.entity}/${e.entity_id || e.entityId || e.id || ''}`).join(', '), note);
    return { ok: true, ...event, outboxId };
  }

  const APPROVAL_TTL_MS = Number(process.env.PUBLISH_APPROVAL_TTL_MS || 24 * 3600000);

  async function notifyApprovers(subject, text, meta) {
    const staff = (await repos.users.all()).filter((u) => u.active && (u.role === 'super_admin' || u.role === 'reviewer'));
    for (const u of staff) {
      await notify.send({ channel: 'email', to: u.email, subject, text, meta }).catch(() => {});
    }
    return staff.length;
  }

  async function publish(entities, session, options = {}) {
    const actor = getActor(session);
    const dirty = await dirtySet();
    const sensitive = dirty.items.filter(isSensitiveChange);

    if (sensitive.length) {
      const rows = (await client.query("SELECT * FROM publish_approvals ORDER BY created_at DESC LIMIT 50")).rows;
      const sameSet = (row) => {
        const cs = typeof row.change_set === 'string' ? JSON.parse(row.change_set) : (row.change_set || {});
        return Array.isArray(cs.items) && JSON.stringify(cs.items) === JSON.stringify(dirty.items);
      };
      // still-valid coverage: an approval signed off on THIS exact content state
      // (decided at/after the newest dirty audit row) enqueues directly
      const covered = rows.find((row) => row.status === 'approved' && sameSet(row) && Number(row.decided_at || 0) >= dirty.maxAuditTs);
      if (covered) return enqueuePublish(entities, options, actor, ` (dual-approved by ${covered.decided_by})`);
      const pending = rows.find((row) => row.status === 'pending' && sameSet(row));
      if (pending) return { pending: true, approvalId: pending.id, changeSet: dirty.items };

      const approvalId = 'apr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await client.query(
        'INSERT INTO publish_approvals (id, requested_by, change_set, status, expires_at, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
        [approvalId, actor, JSON.stringify({ items: dirty.items, maxAuditTs: dirty.maxAuditTs, entities: entities || [], purgeAll: options.purgeAll === true }), 'pending', Date.now() + APPROVAL_TTL_MS, Date.now()]
      );
      await repos.audit(actor, 'cms_publish_approval_requested', approvalId, sensitive.join(', '));
      await notifyApprovers(`Publish approval required — ${sensitive.length} sensitive change(s)`,
        `${actor} requested a publish containing sensitive changes: ${sensitive.join(', ')}. Approval expires in ${Math.round(APPROVAL_TTL_MS / 3600000)}h.`,
        { event: 'cms.approval_required', ref: approvalId });
      return { pending: true, approvalId, changeSet: dirty.items };
    }

    return enqueuePublish(entities, options, actor);
  }

  async function listApprovals({ status } = {}) {
    const r = status && status !== 'all'
      ? await client.query('SELECT * FROM publish_approvals WHERE status = $1 ORDER BY created_at DESC LIMIT 100', [status])
      : await client.query('SELECT * FROM publish_approvals ORDER BY created_at DESC LIMIT 100');
    return r.rows.map((row) => {
      const cs = typeof row.change_set === 'string' ? JSON.parse(row.change_set) : (row.change_set || {});
      return { id: row.id, requestedBy: row.requested_by, status: row.status, items: cs.items || [], entities: cs.entities || [], expiresAt: Number(row.expires_at), decidedBy: row.decided_by, decidedAt: Number(row.decided_at) || null, outboxId: row.outbox_id, createdAt: Number(row.created_at) };
    });
  }

  /* rm(7.3-2): approve/reject. The requester can never decide their own request (a
   * second session of the same user is still 403); approval re-validates the dirty
   * set (409 on drift) and the TTL (409 expired). */
  async function decideApproval(id, decision, session, reason = '') {
    const actor = getActor(session);
    const row = (await client.query('SELECT * FROM publish_approvals WHERE id = $1', [id])).rows[0];
    if (!row) throw new HttpError(404, 'Approval request not found');
    if (row.status !== 'pending') throw new HttpError(409, `Approval already ${row.status}`);
    if (String(actor).toLowerCase() === String(row.requested_by).toLowerCase()) {
      throw new HttpError(403, 'The requester cannot approve their own publish (SEC-11 dual approval)');
    }
    if (Number(row.expires_at) < Date.now()) {
      await client.query("UPDATE publish_approvals SET status='expired', decided_by=$2, decided_at=$3 WHERE id=$1", [id, actor, Date.now()]);
      throw new HttpError(409, 'Approval request expired');
    }
    const cs = typeof row.change_set === 'string' ? JSON.parse(row.change_set) : (row.change_set || {});
    /* Rejecting is always safe and needs no drift check — previously a drifted
     * request could be neither approved nor rejected until the 24 h TTL. */
    if (decision === 'reject') {
      await client.query("UPDATE publish_approvals SET status='rejected', reason=$2, decided_by=$3, decided_at=$4 WHERE id=$1", [id, reason || '', actor, Date.now()]);
      await repos.audit(actor, 'cms_approval_rejected', id, reason || '');
      await notifyApprovers(`Publish rejected — ${id}`, `${actor} rejected the publish request ${id}${reason ? ': ' + reason : ''}.`, { event: 'cms.approval_rejected', ref: id });
      return { ok: true, status: 'rejected' };
    }
    const dirty = await dirtySet();
    if (JSON.stringify(dirty.items) !== JSON.stringify(cs.items || [])) {
      /* Expire the stale request so a re-request creates a fresh approval. */
      await client.query("UPDATE publish_approvals SET status='expired', decided_by=$2, decided_at=$3 WHERE id=$1", [id, actor, Date.now()]);
      throw new HttpError(409, `Dirty set changed since the request (${(cs.items || []).length} → ${dirty.items.length} items) — re-request approval`);
    }
    /* rm(10.3-1 pen CMS-14): the item SET can stay identical while the SAME record is
     * edited again. Compare the dirty set's newest audit timestamp too, so an
     * approval can never cover content written after it was requested. */
    if (Number(dirty.maxAuditTs) > Number(cs.maxAuditTs || 0)) {
      await client.query("UPDATE publish_approvals SET status='expired', decided_by=$2, decided_at=$3 WHERE id=$1", [id, actor, Date.now()]);
      throw new HttpError(409, 'Content changed since the request — re-request approval');
    }

    const enqueued = await enqueuePublish(cs.entities || [{ entity: 'site', entity_id: 'all' }], { purgeAll: cs.purgeAll !== false }, actor, ` (dual-approved publish ${id} requested by ${row.requested_by})`);
    await client.query("UPDATE publish_approvals SET status='approved', decided_by=$2, decided_at=$3, outbox_id=$4 WHERE id=$1", [id, actor, Date.now(), enqueued.outboxId]);
    await repos.audit(actor, 'cms_approval_granted', id, `requested by ${row.requested_by}`);
    return { ok: true, status: 'approved', outboxId: enqueued.outboxId };
  }

  /* ---- emergency publish (F4 v2.0) — rm(7.3-2): super_admin override ONLY.
   * The old body-supplied secondApproverEmail path is gone: an attested approver
   * never was an approver. A super_admin override is audited as
   * cms_emergency_override and every super_admin is notified. */
  async function emergencyPublish({ entity, entityId, entity_id, payload, reason }, session) {
    const actor = getActor(session);
    const eId = entityId || entity_id;
    if (!entity || !eId) throw new HttpError(422, 'entity and entityId are required');
    if (session?.role !== 'super_admin') {
      throw new HttpError(403, 'Emergency publish is a super_admin override — reviewers must use the dual-approval flow (SEC-11)');
    }
    if (payload) {
      await upsertBlock({ entity, entityId: eId, payload }, session);
    }
    const enqueued = await enqueuePublish([{ entity, entity_id: eId }], { purgeAll: true }, actor, ` (EMERGENCY OVERRIDE${reason ? ': ' + String(reason).slice(0, 200) : ''})`);
    await repos.audit(actor, 'cms_emergency_override', `${entity}/${eId}`, reason || 'super_admin emergency override');
    const admins = (await repos.users.all()).filter((u) => u.active && u.role === 'super_admin');
    for (const u of admins) {
      await notify.send({ channel: 'email', to: u.email, subject: `Emergency publish override — ${entity}/${eId}`, text: `${actor} shipped ${entity}/${eId} via super_admin emergency override.${reason ? ' Reason: ' + reason : ''}`, meta: { event: 'cms.emergency_override', ref: `${entity}/${eId}` } }).catch(() => {});
    }
    return { ok: true, emergency: true, notifiedAdmins: admins.length, ...enqueued };
  }

  /* ---- products CRUD (live PostgreSQL catalog) ---- */
  async function listProducts() {
    const r = await client.query(
      'SELECT slug, sku, name, brand, cat, cat_label, descr, short, specs, imgs, stock, is_new, updated_at FROM products ORDER BY brand, name'
    );
    return r.rows;
  }

  async function getProduct(slug) {
    const r = await client.query(
      'SELECT slug, sku, name, brand, cat, cat_label, descr, short, specs, imgs, stock, is_new, updated_at FROM products WHERE slug = $1',
      [slug]
    );
    return r.rows[0] || null;
  }

  /* deploy-audit: products.brand is matched against brands.slug (brand pages, facets); a
   * "Crucial" next to "crucial" split one brand in two and dropped the product from its brand
   * page. Brand values are stored as the lower-case slug. */
  const normBrand = (b) => String(b ?? '').trim().toLowerCase();

  async function createProduct(prod, session) {
    const { slug, name, cat, cat_label, descr, short, specs, imgs, stock, is_new } = prod;
    const brand = normBrand(prod.brand);
    if (!slug || !name) throw new HttpError(422, 'slug and name are required');
    /* deploy-audit: no invented SKU (the slug, upper-cased, was stored and shown as one) */
    const sku = String(prod.sku || '').trim();
    const existing = await getProduct(slug);
    if (existing) throw new HttpError(409, 'Product with this slug already exists');
    const actor = getActor(session);
    const specsJson = typeof specs === 'object' ? JSON.stringify(specs) : (specs || '{}');
    const imgsJson = Array.isArray(imgs) ? JSON.stringify(imgs) : (typeof imgs === 'string' ? JSON.stringify([imgs]) : '[]');
    const stockVal = stock !== undefined ? (stock === true || stock === 'true' || stock === 1 || stock === '1') : true;
    await client.query(
      'INSERT INTO products (slug, sku, name, brand, cat, cat_label, descr, short, specs, imgs, stock, is_new, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [slug, sku, name, brand || '', cat || '', cat_label || cat || '', descr || '', short || '', specsJson, imgsJson, stockVal, !!is_new, Date.now()]
    );
    await repos.audit(actor, 'cms_product_created', slug, name);
    return getProduct(slug);
  }

  async function updateProduct(slug, patch, session) {
    const existing = await getProduct(slug);
    if (!existing) throw new HttpError(404, 'Product not found');
    await saveRevision('products', slug, existing, getActor(session));

    const name = patch.name !== undefined ? patch.name : existing.name;
    const sku = patch.sku !== undefined ? patch.sku : existing.sku;
    const brand = patch.brand !== undefined ? normBrand(patch.brand) : existing.brand;
    const cat = patch.cat !== undefined ? patch.cat : existing.cat;
    const cat_label = patch.cat_label !== undefined ? patch.cat_label : existing.cat_label;
    const descr = patch.descr !== undefined ? patch.descr : existing.descr;
    const short = patch.short !== undefined ? patch.short : existing.short;
    const stock = patch.stock !== undefined ? (patch.stock === true || patch.stock === 'true' || patch.stock === 1 || patch.stock === '1') : existing.stock;
    const is_new = patch.is_new !== undefined ? !!patch.is_new : existing.is_new;

    await client.query(
      `UPDATE products SET name = $1, sku = $2, brand = $3, cat = $4, cat_label = $5, descr = $6, short = $7, stock = $8, is_new = $9, updated_at = $10 WHERE slug = $11`,
      [name, sku, brand, cat, cat_label, descr, short, stock, is_new, Date.now(), slug]
    );

    await repos.audit(getActor(session), 'cms_product_updated', slug, `stock=${stock}, name=${name}`);
    return getProduct(slug);
  }

  async function deleteProduct(slug, session) {
    const existing = await getProduct(slug);
    if (!existing) throw new HttpError(404, 'Product not found');
    const actor = getActor(session);
    await saveRevision('products', slug, existing, actor);
    await client.query('DELETE FROM product_deep WHERE slug = $1', [slug]);
    await client.query('DELETE FROM products WHERE slug = $1', [slug]);
    await repos.audit(actor, 'cms_product_deleted', slug, '');
    return { deleted: true, slug };
  }

  /* ---- product_deep CRUD ---- */
  function formatProductDeep(row) {
    if (!row) return null;
    let specs = row.specs;
    if (typeof specs === 'string') { try { specs = JSON.parse(specs); } catch { specs = {}; } }
    let feats = row.feats;
    if (typeof feats === 'string') { try { feats = JSON.parse(feats); } catch { feats = []; } }
    let use_cases = row.use_cases;
    if (typeof use_cases === 'string') { try { use_cases = JSON.parse(use_cases); } catch { use_cases = []; } }
    let box = row.box;
    if (typeof box === 'string') { try { box = JSON.parse(box); } catch { box = []; } }
    let docs = row.docs;
    if (typeof docs === 'string') { try { docs = JSON.parse(docs); } catch { docs = {}; } }

    const res = {
      slug: row.slug,
      updated_at: row.updated_at ?? null,
      hero: row.hero || '',
      specs,
      feats,
      use_cases,
      box,
      docs
    };

    if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
      if (docs.datasheet_url !== undefined) res.datasheet_url = docs.datasheet_url;
      if (docs.warranty_months !== undefined) res.warranty_months = docs.warranty_months;
      if (docs.compat_matrix !== undefined) res.compat_matrix = docs.compat_matrix;
      if (docs.spec_sheet !== undefined) res.spec_sheet = docs.spec_sheet;
    }
    if (!res.spec_sheet && specs && typeof specs === 'object' && !Array.isArray(specs)) {
      res.spec_sheet = specs;
    }
    if (!res.datasheet_url && typeof row.hero === 'string' && row.hero.startsWith('http')) {
      res.datasheet_url = row.hero;
    }
    return res;
  }

  async function getProductDeep(slug) {
    const r = await client.query('SELECT slug, hero, specs, feats, use_cases, box, docs, updated_at FROM product_deep WHERE slug = $1', [slug]);
    return r.rows[0] ? formatProductDeep(r.rows[0]) : null;
  }

  async function upsertProductDeep(slug, data, session) {
    if (!slug) throw new HttpError(422, 'slug is required');
    const existing = await getProductDeep(slug);
    const actor = getActor(session);
    const { hero, specs, feats, use_cases, box, docs, datasheet_url, warranty_months, spec_sheet, compat_matrix } = data;
    /* deploy-audit D05: a field the caller omits KEEPS its stored value. This used to write
     * hero '' and feats/use_cases/box '[]' for every omitted field, and the CMS product
     * modal sends only { warranty_months, datasheet_url, specs } — so the first save of a
     * product wiped its PDP hero, features, use cases and box contents. */
    const prev = existing || {};
    const keep = (v, old, dflt) => (v !== undefined ? v : (old !== undefined && old !== null ? old : dflt));
    /* docs has ONE stored shape: { items: [{title,url,label,desc}], datasheet_url,
     * warranty_months, compat_matrix, spec_sheet }. An array input (legacy) becomes items;
     * it used to be discarded (docsObj = {}), so document lists could never be saved. */
    const asDocs = (d) => (Array.isArray(d) ? { items: d } : (d && typeof d === 'object' ? { ...d } : {}));
    const docsObj = docs !== undefined ? asDocs(docs) : asDocs(prev.docs);
    if (datasheet_url !== undefined) docsObj.datasheet_url = datasheet_url;
    if (warranty_months !== undefined) {
      const n = warranty_months === '' || warranty_months === null ? null : Number(warranty_months);
      if (n !== null && !(Number.isInteger(n) && n >= 0 && n <= 240)) throw new HttpError(422, 'warranty_months must be a whole number of months (0–240)');
      docsObj.warranty_months = n;
    }
    if (compat_matrix !== undefined) docsObj.compat_matrix = compat_matrix;
    if (spec_sheet !== undefined) docsObj.spec_sheet = spec_sheet;

    const specsV = keep(specs !== undefined ? specs : spec_sheet, prev.specs, {});
    const specsJ = typeof specsV === 'object' ? JSON.stringify(specsV) : (specsV || '{}');
    const asJsonArray = (v) => (Array.isArray(v) ? JSON.stringify(v) : (typeof v === 'string' && v ? v : '[]'));
    const heroV = keep(hero, prev.hero, '');
    const featsJ = asJsonArray(keep(feats, prev.feats, []));
    const useCasesJ = asJsonArray(keep(use_cases, prev.use_cases, []));
    const boxJ = asJsonArray(keep(box, prev.box, []));
    /* rm(9.2-2)/F-2026-N10: product documents are downloaded from the public site —
     * docs.items[].url and datasheet_url are stored public URLs (roadmap 3.2-2 table). */
    for (const d of Array.isArray(docsObj.items) ? docsObj.items : []) if (d && typeof d === 'object' && typeof d.url === 'string')
      assertSafePublicUrl(d.url, 'docs[].url');
    assertSafePublicUrl(docsObj.datasheet_url, 'datasheet_url');
    const docsJ = JSON.stringify(docsObj);

    if (existing) {
      await saveRevision('product_deep', slug, existing, actor);
      await client.query(
        'UPDATE product_deep SET hero=$1, specs=$2, feats=$3, use_cases=$4, box=$5, docs=$6, updated_at=$7 WHERE slug=$8',
        [heroV, specsJ, featsJ, useCasesJ, boxJ, docsJ, Date.now(), slug]
      );
    } else {
      await client.query(
        'INSERT INTO product_deep (slug, hero, specs, feats, use_cases, box, docs, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [slug, heroV, specsJ, featsJ, useCasesJ, boxJ, docsJ, Date.now()]
      );
    }
    await repos.audit(actor, 'cms_product_deep_upserted', slug, '');
    return getProductDeep(slug);
  }

  /* ---- brands CRUD ---- */
  function formatBrand(row) {
    if (!row) return null;
    let counts = row.counts;
    if (typeof counts === 'string') {
      try { counts = JSON.parse(counts); } catch { counts = {}; }
    } else if (!counts || typeof counts !== 'object') {
      counts = {};
    }
    const cat_count = Number(counts.cat_count ?? counts.count ?? 0);
    const status = counts.status || row.note || '';
    const lines = counts.lines || row.line || '';
    const cert = counts.cert || '';
    return {
      slug: row.slug,
      name: row.name,
      updated_at: row.updated_at ?? null,
      counts,
      line: row.line || lines,
      note: row.note || status,
      cat_count,
      status,
      lines,
      cert
    };
  }

  async function listBrands() {
    const r = await client.query('SELECT slug, name, counts, line, note, updated_at FROM brands ORDER BY name');
    return r.rows.map(formatBrand);
  }

  async function getBrand(slug) {
    const r = await client.query('SELECT slug, name, counts, line, note, updated_at FROM brands WHERE slug = $1', [slug]);
    return r.rows[0] ? formatBrand(r.rows[0]) : null;
  }

  async function upsertBrand(brand, session) {
    const { slug, name, counts, line, note, status, lines, cert, cat_count } = brand;
    if (!slug || !name) throw new HttpError(422, 'slug and name are required');
    const existing = await getBrand(slug);
    const actor = getActor(session);
    
    /* deploy-audit D08: omitted fields keep their stored values. The CMS modal sent
     * counts {count:0} and note = the tagline on every save, so editing a brand reset its
     * counts and replaced its overview with its tagline. */
    const parseCounts = (c) => (typeof c === 'string' ? (() => { try { return JSON.parse(c) || {}; } catch { return {}; } })() : (c && typeof c === 'object' ? { ...c } : {}));
    let countsObj = counts === undefined ? parseCounts(existing?.counts) : parseCounts(counts);
    if (cat_count !== undefined) {
      countsObj.cat_count = Number(cat_count);
      countsObj.count = Number(cat_count);
    }
    if (status !== undefined) countsObj.status = status;
    if (lines !== undefined) countsObj.lines = lines;
    if (cert !== undefined) countsObj.cert = cert;

    const brandLine = line !== undefined ? String(line).trim() : (lines !== undefined ? lines : (existing?.line ?? countsObj.lines ?? ''));
    const brandNote = note !== undefined ? String(note).trim() : (status !== undefined ? status : (existing?.note ?? countsObj.status ?? ''));

    if (existing) {
      await saveRevision('brands', slug, existing, actor);
      await client.query(
        'UPDATE brands SET name=$1, counts=$2, line=$3, note=$4, updated_at=$5 WHERE slug=$6',
        [name, JSON.stringify(countsObj), brandLine, brandNote, Date.now(), slug]
      );
    } else {
      await client.query(
        'INSERT INTO brands (slug, name, counts, line, note, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [slug, name, JSON.stringify(countsObj), brandLine, brandNote, Date.now()]
      );
    }
    await repos.audit(actor, 'cms_brand_upserted', slug, name);
    return getBrand(slug);
  }

  async function deleteBrand(slug, session) {
    const existing = await getBrand(slug);
    if (!existing) throw new HttpError(404, 'Brand not found');
    const actor = getActor(session);
    await saveRevision('brands', slug, existing, actor);
    await client.query('DELETE FROM brands WHERE slug = $1', [slug]);
    await repos.audit(actor, 'cms_brand_deleted', slug, '');
    return { deleted: true, slug };
  }

  /* ---- media assets inventory ---- */
  /* rm(4.4-1)/F-2026-N05: canonical store is the portal DATA dir (outside any webroot).
   * Public webroot access is impossible; the authorized route serves previews. */
  function getMediaDir() {
    const dir = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'uploads', 'media');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  function serveMediaFile(filename) {
    const safe = path.basename(String(filename || ''));
    const p = path.join(getMediaDir(), safe);
    if (!safe || !fs.existsSync(p)) throw new HttpError(404, 'Media file not found');
    return fs.createReadStream(p);
  }

  async function listMedia() {
    const mediaDir = getMediaDir();
    let files = [];
    try {
      if (fs.existsSync(mediaDir)) {
        files = fs.readdirSync(mediaDir).filter(f => /\.(png|jpe?g|webp|svg)$/i.test(f));
      }
    } catch { /* proceed with empty */ }

    let productImgsMap = {};
    try {
      const pr = await client.query('SELECT slug, name, brand, cat, imgs FROM products');
      for (const row of pr.rows) {
        let imgs = [];
        if (Array.isArray(row.imgs)) imgs = row.imgs;
        else if (typeof row.imgs === 'string') {
          try { imgs = JSON.parse(row.imgs); } catch { imgs = [row.imgs]; }
        }
        for (const imgPath of imgs) {
          const fn = path.basename(imgPath);
          if (fn) {
            productImgsMap[fn] = { slug: row.slug, name: row.name, brand: row.brand, cat: row.cat };
          }
        }
      }
    } catch { /* proceed without map */ }

    return files.map(f => {
      const pInfo = productImgsMap[f] || {};
      let brand = pInfo.brand || '';
      if (!brand) {
        const lower = f.toLowerCase();
        if (lower.startsWith('crucial')) brand = 'Crucial';
        else if (lower.startsWith('koorui')) brand = 'KOORUI';
        else if (lower.startsWith('honeywell') || lower.startsWith('hc00')) brand = 'Honeywell';
        else if (lower.startsWith('ugreen')) brand = 'UGREEN';
        else if (lower.startsWith('aiwa')) brand = 'Aiwa';
        else if (lower.startsWith('kingston')) brand = 'Kingston';
        else if (lower.startsWith('samsung')) brand = 'Samsung';
        else if (lower.startsWith('toshiba')) brand = 'Toshiba';
        else if (lower.startsWith('dell')) brand = 'Dell';
        else if (lower.startsWith('hp')) brand = 'HP';
        else if (lower.startsWith('western-digital') || lower.startsWith('wind-pro')) brand = 'Western Digital';
        else if (lower.startsWith('msi')) brand = 'MSI';
        else if (lower.startsWith('sandisk')) brand = 'SanDisk';
        else if (lower.startsWith('arktek')) brand = 'Arktek';
        else brand = 'General';
      }
      return {
        file: f,
        filename: f,
        name: pInfo.name || f.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        brand: brand.charAt(0).toUpperCase() + brand.slice(1),
        cat: pInfo.cat || 'Hardware',
        url: 'assets/img/products/' + f,
        slug: pInfo.slug || null
      };
    });
  }

  async function uploadMediaFile(data, session, scanBuffer) {
    /* rm(10.3-1 pen): the console posts `dataBase64`; accept both keys. */
    const { filename, brand } = data;
    const base64 = data.base64 || data.dataBase64;
    if (!filename) throw new HttpError(400, 'filename is required');
    const safeName = path.basename(filename);
    // rm(4.4-2)/F-2026-N05: svg banned (active content); 5 MB cap; AV-scanned before store.
    if (!/\.(png|jpe?g|webp)$/i.test(safeName)) {
      throw new HttpError(400, 'Only png, jpg, jpeg, webp files are permitted (svg is not allowed)');
    }

    let buf;
    if (base64 && base64.includes('base64,')) {
      buf = Buffer.from(base64.split('base64,')[1], 'base64');
    } else if (base64) {
      buf = Buffer.from(base64, 'base64');
    } else {
      throw new HttpError(400, 'base64 data is required');
    }
    if (buf.length > 5 * 1024 * 1024) throw new HttpError(413, 'File exceeds the 5 MB limit');
    if (typeof scanBuffer === 'function') {
      const scan = await scanBuffer(buf, safeName);
      if (!scan.clean) throw new HttpError(400, 'Security check failed: upload rejected');
    }

    // canonical store: data/uploads/media (OUTSIDE the webroot; served only via the authorized route)
    fs.writeFileSync(path.join(getMediaDir(), safeName), buf);
    // site-asset copy so the image ships with the next SSG build
    /* deploy-audit D09: four levels up resolved to a stray Codebase/site/, so uploaded images
     * never reached apps/site/public and never shipped. Same site root as the SSG worker. */
    const siteAssets = siteProductImagesDir();
    try {
      fs.mkdirSync(siteAssets, { recursive: true });
      fs.writeFileSync(path.join(siteAssets, safeName), buf);
    } catch { /* site copy best-effort */ }

    const actor = getActor(session);
    await repos.audit(actor, 'cms_media_uploaded', safeName, brand || '');
    return {
      filename: safeName,
      file: safeName,
      url: '/api/cms/media/file/' + safeName,
      size: buf.length
    };
  }

  function siteProductImagesDir() {
    return path.join(process.env.SITE_DIR || path.resolve(__dirname, '../../../site'), 'public', 'assets', 'img', 'products');
  }

  async function deleteMediaFile(filename, session) {
    if (!filename) throw new HttpError(400, 'filename is required');
    const safeName = path.basename(filename);
    const targetDirs = [
      getMediaDir(),
      siteProductImagesDir()
    ];
    for (const d of targetDirs) {
      try {
        const fp = path.join(d, safeName);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } catch { /* best effort */ }
    }
    const actor = getActor(session);
    await repos.audit(actor, 'cms_media_deleted', safeName, '');
    return { ok: true, deleted: safeName };
  }

  /* ---- outbox stream monitor ---- */
  async function listOutbox(limit = 50) {
    if (!client) {
      const items = (repos.outbox && typeof repos.outbox.all === 'function') ? (await repos.outbox.all()) : [];
      return items.slice(0, limit).map(i => ({
        id: i.id, channel: i.channel, to_addr: i.to, subject: i.subject,
        body: i.text || i.body, status: i.status, meta: i.meta, created_at: i.createdAt
      }));
    }
    const r = await client.query(
      'SELECT id, channel, to_addr, subject, body, status, meta, created_at FROM outbox ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return r.rows;
  }

  /* ---- announcements CRUD ---- */
  async function listAnnouncements() {
    const r = await client.query('SELECT * FROM announcements ORDER BY id');
    return r.rows;
  }

  async function upsertAnnouncement({ id = 1, text, cta_href, cta_label, active = true, starts_at, ends_at }, session) {
    if (!text) throw new HttpError(422, 'text is required');
    assertSafePublicUrl(cta_href, 'cta_href'); // rm(3.2-2)/F-2026-N10
    const existing = await client.query('SELECT * FROM announcements WHERE id = $1', [id]);
    const label = cta_label !== undefined ? cta_label : (existing.rows[0]?.cta_label || 'See the SKU & RFQ channel pricing →');
    const startsAt = starts_at !== undefined ? starts_at : (existing.rows[0]?.starts_at || null);
    const endsAt = ends_at !== undefined ? ends_at : (existing.rows[0]?.ends_at || null);
    if (existing.rows[0]) {
      await saveRevision('announcements', String(id), existing.rows[0], (session?.user?.email || 'system'));
      await client.query(
        'UPDATE announcements SET text = $1, cta_href = $2, cta_label = $3, active = $4, starts_at = $5, ends_at = $6 WHERE id = $7',
        [text, cta_href || '', label, active, startsAt, endsAt, id]
      );
    } else {
      await client.query(
        'INSERT INTO announcements (id, text, cta_href, cta_label, active, starts_at, ends_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, text, cta_href || '', label, active, startsAt || Date.now(), endsAt]
      );
    }
    await repos.audit((session?.user?.email || 'system'), 'cms_announcement_upserted', `announcement-${id}`, text);
    return (await client.query('SELECT * FROM announcements WHERE id = $1', [id])).rows[0];
  }

  /* ---- testimonials CRUD ---- */
  async function listTestimonials() {
    const r = await client.query('SELECT * FROM testimonials ORDER BY id');
    return r.rows;
  }

  async function upsertTestimonial({ id, quote, name, role, company = null, active = true }, session) {
    if (!quote) throw new HttpError(422, 'quote is required');
    if (!name) throw new HttpError(422, 'name is required');
    let recId = id ? parseInt(id, 10) : null;
    if (recId) {
      const existing = await client.query('SELECT * FROM testimonials WHERE id = $1', [recId]);
      if (existing.rows[0]) {
        await saveRevision('testimonials', String(recId), existing.rows[0], (session?.user?.email || 'system'));
        await client.query(
          'UPDATE testimonials SET quote = $1, name = $2, role = $3, company = $4, active = $5 WHERE id = $6',
          [quote, name, role || '', company, active, recId]
        );
      } else {
        await client.query(
          'INSERT INTO testimonials (id, quote, name, role, company, active) VALUES ($1, $2, $3, $4, $5, $6)',
          [recId, quote, name, role || '', company, active]
        );
      }
    } else {
      const ins = await client.query(
        'INSERT INTO testimonials (quote, name, role, company, active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [quote, name, role || '', company, active]
      );
      recId = ins.rows[0].id;
    }
    await repos.audit((session?.user?.email || 'system'), 'cms_testimonial_upserted', `testimonial-${recId}`, name);
    return (await client.query('SELECT * FROM testimonials WHERE id = $1', [recId])).rows[0];
  }

  async function deleteTestimonial(id, session) {
    const existing = await client.query('SELECT * FROM testimonials WHERE id = $1', [id]);
    if (!existing.rows[0]) throw new HttpError(404, 'Testimonial not found');
    await saveRevision('testimonials', String(id), existing.rows[0], (session?.user?.email || 'system'));
    await client.query('DELETE FROM testimonials WHERE id = $1', [id]);
    await repos.audit((session?.user?.email || 'system'), 'cms_testimonial_deleted', `testimonial-${id}`, '');
    return { ok: true, deleted: id };
  }

  /* ---- localization parity audit (CMS-8) ---- */
  async function getLocAudit() {
    const [cbEn, cbAr, polEn, polAr, prodTotal, slidesTotal, solTotal] = await Promise.all([
      client.query("SELECT count(*) FROM content_blocks WHERE lang = 'en'"),
      client.query("SELECT count(*) FROM content_blocks WHERE lang = 'ar'"),
      client.query("SELECT count(*) FROM legal_policies WHERE lang = 'en'"),
      client.query("SELECT count(*) FROM legal_policies WHERE lang = 'ar'"),
      client.query("SELECT count(*) FROM products"),
      client.query("SELECT count(*) FROM hero_slides"),
      client.query("SELECT count(*) FROM content_blocks WHERE entity = 'it_solution'")
    ]);
    const nCbEn = parseInt(cbEn.rows[0].count, 10);
    const nCbAr = parseInt(cbAr.rows[0].count, 10);
    const nPolEn = parseInt(polEn.rows[0].count, 10);
    const nPolAr = parseInt(polAr.rows[0].count, 10);
    const nProds = parseInt(prodTotal.rows[0].count, 10);
    const nSlides = parseInt(slidesTotal.rows[0].count, 10);
    const nSols = parseInt(solTotal.rows[0].count, 10);

    const polPct = nPolEn ? Math.round((nPolAr / nPolEn) * 100) : 0;
    const cbPct = nCbEn ? Math.round((nCbAr / nCbEn) * 100) : 0;
    return {
      policies: { en: nPolEn, ar: nPolAr, pct: polPct },
      contentBlocks: { en: nCbEn, ar: nCbAr, pct: cbPct },
      solutions: { count: nSols, ar: 0, pct: 0 },
      slides: { count: nSlides, ar: 0, pct: 0 },
      products: { count: nProds },
      overallParityPct: Math.round(((nPolAr + nCbAr) / Math.max(1, nPolEn + nCbEn)) * 100)
    };
  }

  /* ---- publish pipeline telemetry (CMS-10) ---- */
  async function getPublishTelemetry() {
    const [outboxCounts, lastPub, lastBuild, counts] = await Promise.all([
      client.query("SELECT status, count(*) AS n FROM outbox WHERE channel = 'cms' GROUP BY status"),
      client.query("SELECT created_at, status FROM outbox WHERE channel = 'cms' AND (status = 'processed' OR status = 'sent') ORDER BY created_at DESC LIMIT 1"),
      client.query("SELECT id, status, meta, created_at FROM outbox WHERE to_addr = 'ssg-builder' AND status IN ('processed','failed') ORDER BY created_at DESC LIMIT 1"), // rm(5.1-1)
      client.query("SELECT (SELECT count(*) FROM content_blocks) AS blocks, (SELECT count(*) FROM hero_slides) AS slides, (SELECT count(*) FROM legal_policies) AS policies, (SELECT count(*) FROM products) AS products, (SELECT count(*) FROM testimonials) AS testimonials, (SELECT count(*) FROM announcements) AS announcements, (SELECT count(*) FROM brands) AS brands")
    ]);
    const statusMap = {};
    for (const r of outboxCounts.rows) statusMap[r.status] = parseInt(r.n, 10);

    const distPaths = [
      path.resolve(process.cwd(), 'apps/site/dist/index.html'),
      path.resolve(process.cwd(), 'dist/index.html'),
      path.resolve(__dirname, '../../../site/dist/index.html')
    ];
    const distExists = distPaths.some(p => fs.existsSync(p));

    const queueInfo = {
      queued: (statusMap['queued'] || 0) + (statusMap['processing'] || 0), /* 'processing' = claimed by the worker (deploy-audit H6) */
      pending: statusMap['pending'] || 0,
      processed: (statusMap['processed'] || 0) + (statusMap['sent'] || 0),
      failed: statusMap['failed'] || 0,
      total: Object.values(statusMap).reduce((a, b) => a + b, 0)
    };

    return {
      queue: queueInfo,
      queued: queueInfo.queued,
      processed: (statusMap['processed'] || 0) + (statusMap['sent'] || 0),
      failed: statusMap['failed'] || 0,
      distExists,
      lastPublishTs: lastPub.rows[0] ? parseInt(lastPub.rows[0].created_at, 10) : null,
      /* rm(5.1-1)/CMS-10: the LAST BUILD outcome (any status) — the dashboard must be able to
       * say "FAILED" instead of "all published" when the newest build errored. */
      lastBuild: lastBuild.rows[0] ? {
        outboxId: lastBuild.rows[0].id,
        status: lastBuild.rows[0].status,
        durationMs: (lastBuild.rows[0].meta && lastBuild.rows[0].meta.durationMs) || null,
        error: (lastBuild.rows[0].meta && lastBuild.rows[0].meta.error) || null,
        ts: parseInt(lastBuild.rows[0].created_at, 10),
      } : null,
      entities: counts.rows[0] || {}
    };
  }

  return {
    listBlocks, getBlock, upsertBlock, deleteBlock,
    listSlides, upsertSlide, deleteSlide,
    listPolicies, getPolicy, upsertPolicy,
    listRevisions, rollback, publish, emergencyPublish,
    listApprovals, decideApproval,
    listProducts, getProduct, createProduct, updateProduct, deleteProduct,
    getProductDeep, upsertProductDeep,
    listBrands, getBrand, upsertBrand, deleteBrand,
    listMedia, uploadMediaFile, deleteMediaFile, serveMediaFile, listCategories, renameCategory,
    listOutbox, getLocAudit, getPublishTelemetry,
    listAnnouncements, upsertAnnouncement,
    listTestimonials, upsertTestimonial, deleteTestimonial,
  };
}

/* rm(7.3-4): pure classification helpers, exported for unit tests */
export function isSensitiveEntity(entity, entityId) {
  const ent = String(entity || '').toLowerCase();
  const eid = String(entityId || '').toLowerCase();
  if ((ent === 'erp' && eid.includes('pricing')) || eid.includes('pricing') || ent.includes('pricing')) return true;
  if (eid.includes('brand-auth') || eid.includes('brand_auth') || eid.includes('authorization') || eid.includes('claims-register') || eid.includes('brand-claims')) return true;
  if (eid.includes('peppol-dates') || eid.includes('compliance-dates') || eid.includes('statutory-dates') || (ent === 'compliance' && eid.includes('dates'))) return true;
  return false;
}

/* Map an audit (action, target) pair onto a normalized '<domain>/<id>' change key.
 * Pure — exported for the unit tests. */
export function changeKey(action, target) {
  const t = String(target || '');
  switch (action) {
    case 'cms_policy_upserted': return 'legal_policies/' + t;
    case 'cms_announcement_upserted': return 'announcements/' + t.replace(/^announcement-/, '');
    case 'cms_testimonial_upserted':
    case 'cms_testimonial_deleted': return 'testimonials/' + t.replace(/^testimonial-/, '');
    case 'cms_slide_upserted':
    case 'cms_slide_deleted': return 'hero_slides/' + t.replace(/^slide-/, '');
    case 'cms_rollback': {
      const [table, ...rest] = t.split('/');
      const recordId = rest.join('/');
      if (table === 'content_blocks') {
        // record ids here are 'entity:id[:lang]' — collapse to entity/id
        const parts = recordId.split(':');
        return (parts.length > 1 ? parts[0] + '/' + parts[1] : recordId);
      }
      if (table === 'hero_slides') return 'hero_slides/' + recordId;
      if (table === 'legal_policies') return 'legal_policies/' + recordId;
      if (table === 'announcements') return 'announcements/' + recordId;
      if (table === 'testimonials') return 'testimonials/' + recordId;
      return t;
    }
    default: return t; // cms_block_upserted/deleted already carry 'entity/id'; products/brands/media keys pass through
  }
}

/* rm(7.3-3): sensitive domains — public legal/marketing content — plus the
 * pricing / brand-auth / claims / compliance-date rules. Pure — unit-tested. */
export function isSensitiveChange(key) {
  const k = String(key || '').toLowerCase();
  if (k.startsWith('legal_policies/') || k.startsWith('announcements/') ||
      k.startsWith('hero_slides/') || k.startsWith('testimonials/')) return true;
  const slash = k.indexOf('/');
  return slash > 0 ? isSensitiveEntity(k.slice(0, slash), k.slice(slash + 1)) : isSensitiveEntity(k, '');
}

