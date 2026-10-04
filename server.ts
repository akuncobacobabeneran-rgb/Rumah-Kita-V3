import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '.data');
const DB_FILE = path.join(DATA_DIR, 'rumahkita-shared-db.json');

interface SharedDbState {
  familiesById: Record<string, any>;
  inviteCodeToFamilyId: Record<string, string>;
  usersByEmail: Record<string, any>;
  supabaseConfig?: {
    url: string;
    anonKey: string;
  };
}

function normalizeInviteCode(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim().toUpperCase();
  // Extract RK-XXXX if user pasted text like "RK-8F2A (UUID: ...)"
  const rkMatch = trimmed.match(/RK[-\s]?([A-Z0-9]{3,10})/);
  if (rkMatch) {
    return `RK-${rkMatch[1]}`;
  }
  const clean = trimmed.replace(/[^A-Z0-9-]/g, '');
  if (/^[A-Z0-9]{4,6}$/.test(clean) && !clean.startsWith('RK')) {
    return `RK-${clean}`;
  }
  return clean;
}

function loadSharedDb(): SharedDbState {
  const defaultSupabaseConfig = {
    url: (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim(),
    anonKey: (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim(),
  };
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        familiesById: parsed.familiesById || {},
        inviteCodeToFamilyId: parsed.inviteCodeToFamilyId || {},
        usersByEmail: parsed.usersByEmail || {},
        supabaseConfig:
          parsed.supabaseConfig?.url && parsed.supabaseConfig?.anonKey
            ? parsed.supabaseConfig
            : defaultSupabaseConfig,
      };
    }
  } catch (err) {
    console.warn('Failed to read shared DB file, starting fresh:', err);
  }
  return {
    familiesById: {},
    inviteCodeToFamilyId: {},
    usersByEmail: {},
    supabaseConfig: defaultSupabaseConfig,
  };
}

function saveSharedDb(db: SharedDbState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist shared DB file:', err);
  }
}

const sharedDb: SharedDbState = loadSharedDb();

function mergeArraysById(existingArr: any[] = [], incomingArr: any[] = [], canonicalFamilyId: string): any[] {
  const map = new Map<string, any>();
  for (const item of existingArr) {
    if (item && item.id) {
      map.set(item.id, { ...item, family_id: canonicalFamilyId });
    }
  }
  for (const item of incomingArr) {
    if (item && item.id) {
      const prev = map.get(item.id);
      if (!prev) {
        map.set(item.id, { ...item, family_id: canonicalFamilyId });
      } else {
        const prevTime = new Date(prev.updated_at || prev.created_at || 0).getTime();
        const nextTime = new Date(item.updated_at || item.created_at || 0).getTime();
        if (nextTime >= prevTime) {
          map.set(item.id, { ...prev, ...item, family_id: canonicalFamilyId });
        }
      }
    }
  }
  return Array.from(map.values());
}

function mergeCategories(existingArr: any[] = [], incomingArr: any[] = [], canonicalFamilyId: string): any[] {
  const byKey = new Map<string, any>();
  for (const cat of existingArr) {
    if (!cat) continue;
    const key = `${(cat.type || '').toLowerCase()}::${(cat.name || '').trim().toLowerCase()}`;
    byKey.set(key, { ...cat, family_id: canonicalFamilyId });
  }
  for (const cat of incomingArr) {
    if (!cat) continue;
    const key = `${(cat.type || '').toLowerCase()}::${(cat.name || '').trim().toLowerCase()}`;
    if (!byKey.has(key)) {
      byKey.set(key, { ...cat, family_id: canonicalFamilyId });
    }
  }
  return Array.from(byKey.values());
}

function mergeConversationCards(existingArr: any[] = [], incomingArr: any[] = [], canonicalFamilyId: string): any[] {
  const byQuestion = new Map<string, any>();
  for (const card of existingArr) {
    if (!card || !card.question) continue;
    const key = card.question.trim().toLowerCase();
    byQuestion.set(key, { ...card, family_id: canonicalFamilyId });
  }
  for (const card of incomingArr) {
    if (!card || !card.question) continue;
    const key = card.question.trim().toLowerCase();
    const prev = byQuestion.get(key);
    if (!prev) {
      byQuestion.set(key, { ...card, family_id: canonicalFamilyId });
    } else {
      byQuestion.set(key, {
        ...prev,
        ...card,
        id: prev.id || card.id,
        family_id: canonicalFamilyId,
        is_discussed: Boolean(prev.is_discussed || card.is_discussed),
        is_favorite: Boolean(prev.is_favorite || card.is_favorite),
        answer_notes: card.answer_notes ?? prev.answer_notes,
        discussed_at: card.discussed_at ?? prev.discussed_at,
      });
    }
  }
  return Array.from(byQuestion.values());
}

function sanitizeServerBundle(bundle: any): any {
  if (!bundle?.family) return bundle;
  const cleanedMembers = (bundle.members || []).filter(
    (m: any) => m && String(m.name || '').trim().toLowerCase() !== 'feni'
  );
  const partnerMember = cleanedMembers.find((m: any) => m.role === 'Pasangan');
  const adminMember = cleanedMembers.find((m: any) => m.role === 'Admin');

  let cleanFamilyName = String(bundle.family.name || 'Keluarga Harmonis').trim();
  if (/feni/i.test(cleanFamilyName)) {
    cleanFamilyName = adminMember?.name
      ? `Keluarga ${adminMember.name}`
      : 'Keluarga Januar Fuad Almachdi';
  }

  let cleanPartner2 = partnerMember?.name || '';
  if (/^feni$/i.test(cleanPartner2.trim())) {
    cleanPartner2 = '';
  }

  return {
    ...bundle,
    family: {
      ...bundle.family,
      name: cleanFamilyName,
      partner_1_name: adminMember?.name || bundle.family.partner_1_name || 'Kepala Keluarga',
      partner_2_name: cleanPartner2,
    },
    members: cleanedMembers,
  };
}

function mergeMembers(existingMembers: any[] = [], incomingMembers: any[] = [], canonicalFamilyId: string): any[] {
  const combined = [...existingMembers, ...incomingMembers].filter(
    (m) => m && String(m.name || '').trim().toLowerCase() !== 'feni'
  );
  const realPartners = combined.filter(
    (m) => m.role === 'Pasangan' && m.email && m.email.trim().length > 0
  );

  const result: any[] = [];
  const seenKeys = new Set<string>();

  for (const m of combined) {
    // Skip placeholder partner without email if a real partner with email has registered
    if (
      m.role === 'Pasangan' &&
      (!m.email || !m.email.trim()) &&
      realPartners.length > 0
    ) {
      continue;
    }
    const key = m.email?.trim()
      ? `email:${m.email.trim().toLowerCase()}`
      : m.user_id
      ? `uid:${m.user_id}`
      : `name:${(m.name || '').trim().toLowerCase()}`;

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({ ...m, family_id: canonicalFamilyId });
    }
  }
  return result;
}

function mergeFamilyBundles(existing: any, incoming: any): any {
  if (!existing) return sanitizeServerBundle(incoming);
  if (!incoming) return sanitizeServerBundle(existing);

  const cleanExisting = sanitizeServerBundle(existing);
  const cleanIncoming = sanitizeServerBundle(incoming);

  // Prefer the family object created by Admin (or earlier created_at) as canonical ID holder
  const existingHasAdmin = (cleanExisting.members || []).some((m: any) => m.role === 'Admin' && m.email);
  const incomingHasAdmin = (cleanIncoming.members || []).some((m: any) => m.role === 'Admin' && m.email);

  const base = incomingHasAdmin && !existingHasAdmin ? cleanIncoming : cleanExisting;
  const other = base === cleanExisting ? cleanIncoming : cleanExisting;

  const canonicalFamilyId = base.family.id;
  const canonicalInviteCode =
    normalizeInviteCode(base.family.invite_code) ||
    normalizeInviteCode(other.family.invite_code);

  const mergedMembers = mergeMembers(base.members, other.members, canonicalFamilyId);
  const adminMember = mergedMembers.find((m: any) => m.role === 'Admin');
  const partnerMember = mergedMembers.find((m: any) => m.role === 'Pasangan');

  const existingUpdated = new Date(
    cleanExisting.family?.updated_at || cleanExisting.family?.created_at || 0
  ).getTime();
  const incomingUpdated = new Date(
    cleanIncoming.family?.updated_at || cleanIncoming.family?.created_at || 0
  ).getTime();

  const newerFamily =
    incomingUpdated >= existingUpdated ? cleanIncoming.family : cleanExisting.family;
  const olderFamily =
    incomingUpdated >= existingUpdated ? cleanExisting.family : cleanIncoming.family;

  const mergedFamily = {
    ...olderFamily,
    ...newerFamily,
    id: canonicalFamilyId,
    invite_code: canonicalInviteCode,
    name:
      newerFamily.name && newerFamily.name !== 'Keluarga Harmonis'
        ? newerFamily.name
        : olderFamily.name || newerFamily.name || 'Keluarga Harmonis',
    partner_1_name:
      newerFamily.partner_1_name ||
      adminMember?.name ||
      olderFamily.partner_1_name,
    partner_2_name: partnerMember?.name || newerFamily.partner_2_name || '',
    custom_shortcuts:
      Array.isArray(newerFamily.custom_shortcuts) && newerFamily.custom_shortcuts.length > 0
        ? newerFamily.custom_shortcuts
        : Array.isArray(olderFamily.custom_shortcuts) && olderFamily.custom_shortcuts.length > 0
        ? olderFamily.custom_shortcuts
        : undefined,
    updated_at:
      incomingUpdated >= existingUpdated
        ? cleanIncoming.family?.updated_at || new Date().toISOString()
        : cleanExisting.family?.updated_at || new Date().toISOString(),
  };

  return sanitizeServerBundle({
    family: mergedFamily,
    members: mergedMembers,
    wallets: mergeArraysById(base.wallets, other.wallets, canonicalFamilyId),
    transactionCategories: mergeCategories(
      base.transactionCategories,
      other.transactionCategories,
      canonicalFamilyId
    ),
    transactions: mergeArraysById(base.transactions, other.transactions, canonicalFamilyId),
    budgets: mergeArraysById(base.budgets, other.budgets, canonicalFamilyId),
    debts: mergeArraysById(base.debts, other.debts, canonicalFamilyId),
    goals: mergeArraysById(base.goals, other.goals, canonicalFamilyId),
    assets: mergeArraysById(base.assets, other.assets, canonicalFamilyId),
    recurringTransactions: mergeArraysById(
      base.recurringTransactions,
      other.recurringTransactions,
      canonicalFamilyId
    ),
    taskCategories: mergeCategories(base.taskCategories, other.taskCategories, canonicalFamilyId),
    tasks: mergeArraysById(base.tasks, other.tasks, canonicalFamilyId),
    maintenanceItems: mergeArraysById(base.maintenanceItems, other.maintenanceItems, canonicalFamilyId),
    calendarEvents: mergeArraysById(base.calendarEvents, other.calendarEvents, canonicalFamilyId),
    coupleMoments: mergeArraysById(base.coupleMoments, other.coupleMoments, canonicalFamilyId),
    conversationCards: mergeConversationCards(
      base.conversationCards,
      other.conversationCards,
      canonicalFamilyId
    ),
    journalEntries: mergeArraysById(base.journalEntries, other.journalEntries, canonicalFamilyId),
    notifications: mergeArraysById(base.notifications, other.notifications, canonicalFamilyId),
    familyDocuments: mergeArraysById(
      base.familyDocuments,
      other.familyDocuments,
      canonicalFamilyId
    ),
    shoppingItems: mergeArraysById(base.shoppingItems, other.shoppingItems, canonicalFamilyId),
    mealPlans: mergeArraysById(base.mealPlans, other.mealPlans, canonicalFamilyId),
    coupleBucketItems: mergeArraysById(
      base.coupleBucketItems,
      other.coupleBucketItems,
      canonicalFamilyId
    ),
  });
}

function findFamilyInSharedDb(rawCodeOrId: string): any | null {
  if (!rawCodeOrId) return null;
  const trimmed = rawCodeOrId.trim();
  const normalizedCode = normalizeInviteCode(trimmed);
  const bareCode = normalizedCode.replace(/^RK-/, '');

  // 1. Direct family ID match
  if (sharedDb.familiesById[trimmed]) {
    return sharedDb.familiesById[trimmed];
  }

  // 2. Invite code map match
  const mappedId =
    sharedDb.inviteCodeToFamilyId[normalizedCode] ||
    sharedDb.inviteCodeToFamilyId[`RK-${bareCode}`] ||
    sharedDb.inviteCodeToFamilyId[trimmed.toUpperCase()];
  if (mappedId && sharedDb.familiesById[mappedId]) {
    return sharedDb.familiesById[mappedId];
  }

  // 3. Scan all stored families by invite_code, bare code, or UUID prefix
  for (const bundle of Object.values(sharedDb.familiesById)) {
    const fam = bundle?.family;
    if (!fam) continue;
    const famCode = normalizeInviteCode(fam.invite_code || '');
    const famBare = famCode.replace(/^RK-/, '');
    if (
      famCode === normalizedCode ||
      (bareCode.length >= 4 && famBare === bareCode) ||
      fam.id.toLowerCase() === trimmed.toLowerCase() ||
      (trimmed.length >= 6 && fam.id.toLowerCase().startsWith(trimmed.toLowerCase()))
    ) {
      return bundle;
    }
  }

  return null;
}

function indexBundleInSharedDb(bundle: any): any {
  if (!bundle?.family?.id) return bundle;
  const normalizedCode = normalizeInviteCode(bundle.family.invite_code || '');
  if (normalizedCode) {
    bundle.family.invite_code = normalizedCode;
  }

  // Check if a family with the same invite_code or id already exists
  const existing =
    sharedDb.familiesById[bundle.family.id] ||
    (normalizedCode ? findFamilyInSharedDb(normalizedCode) : null);

  const merged = existing ? mergeFamilyBundles(existing, bundle) : bundle;
  const canonicalId = merged.family.id;

  // If old ID differed from canonicalId, point both to merged
  sharedDb.familiesById[canonicalId] = merged;
  if (bundle.family.id !== canonicalId) {
    sharedDb.familiesById[bundle.family.id] = merged;
  }

  if (merged.family.invite_code) {
    const code = normalizeInviteCode(merged.family.invite_code);
    sharedDb.inviteCodeToFamilyId[code] = canonicalId;
    sharedDb.inviteCodeToFamilyId[code.replace(/^RK-/, '')] = canonicalId;
  }

  // Update any stored users whose family_id was merged
  for (const u of Object.values(sharedDb.usersByEmail)) {
    if (u?.profile && (u.profile.family_id === bundle.family.id || u.profile.family_id === canonicalId)) {
      u.profile.family_id = canonicalId;
    }
  }

  saveSharedDb(sharedDb);
  return merged;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', familiesCount: Object.keys(sharedDb.familiesById).length });
  });

  // Shared Supabase Config (so wife's phone automatically gets Supabase URL & Anon Key saved by husband)
  app.get('/api/supabase-config', (_req, res) => {
    res.json(sharedDb.supabaseConfig || { url: '', anonKey: '' });
  });

  app.post('/api/supabase-config', (req, res) => {
    const { url, anonKey } = req.body || {};
    sharedDb.supabaseConfig = {
      url: String(url || '').trim(),
      anonKey: String(anonKey || '').trim(),
    };
    saveSharedDb(sharedDb);
    res.json(sharedDb.supabaseConfig);
  });

  // Lookup family bundle by invite code or Family ID
  app.get('/api/families/by-code/:code', (req, res) => {
    const found = findFamilyInSharedDb(req.params.code);
    res.json({ bundle: found || null });
  });

  // Get family bundle by familyId (or fallback inviteCode query)
  app.get('/api/families/:familyId', (req, res) => {
    const { familyId } = req.params;
    const inviteCode = typeof req.query.inviteCode === 'string' ? req.query.inviteCode : '';
    const found =
      findFamilyInSharedDb(familyId) ||
      (inviteCode ? findFamilyInSharedDb(inviteCode) : null);
    res.json({ bundle: found || null });
  });

  // Sync / Upsert family bundle (and optional user record)
  app.post('/api/families/sync', (req, res) => {
    const { bundle, user } = req.body || {};
    if (user && user.email) {
      sharedDb.usersByEmail[user.email.trim().toLowerCase()] = user;
    }
    if (!bundle || !bundle.family) {
      saveSharedDb(sharedDb);
      res.json({ bundle: null });
      return;
    }
    const merged = indexBundleInSharedDb(bundle);
    res.json({ bundle: merged });
  });

  // Replace/Save exact family bundle (e.g., on delete/reset/update)
  app.post('/api/families/save', (req, res) => {
    const { bundle, user } = req.body || {};
    if (user && user.email) {
      sharedDb.usersByEmail[user.email.trim().toLowerCase()] = user;
    }
    if (!bundle || !bundle.family?.id) {
      res.status(400).json({ error: 'Invalid family bundle' });
      return;
    }
    const cleanIncoming = sanitizeServerBundle(bundle);
    const code = normalizeInviteCode(cleanIncoming.family.invite_code || '');
    const existing =
      sharedDb.familiesById[cleanIncoming.family.id] ||
      (code ? findFamilyInSharedDb(code) : null);

    const canonicalId = existing?.family?.id || cleanIncoming.family.id;
    const exactMembers = (cleanIncoming.members || []).map((m: any) => ({
      ...m,
      family_id: canonicalId,
    }));

    const savedBundle = sanitizeServerBundle({
      ...cleanIncoming,
      family: {
        ...cleanIncoming.family,
        id: canonicalId,
        invite_code: code || cleanIncoming.family.invite_code,
      },
      members: exactMembers,
    });

    if (code) {
      sharedDb.inviteCodeToFamilyId[code] = canonicalId;
      sharedDb.inviteCodeToFamilyId[code.replace(/^RK-/, '')] = canonicalId;
    }
    sharedDb.familiesById[canonicalId] = savedBundle;
    if (cleanIncoming.family.id !== canonicalId) {
      sharedDb.familiesById[cleanIncoming.family.id] = savedBundle;
    }
    saveSharedDb(sharedDb);
    res.json({ bundle: savedBundle });
  });

  // Shared user auth lookup for cross-device login
  app.post('/api/auth/login', (req, res) => {
    const { email, passwordHash, rawPasswordBtoa } = req.body || {};
    if (!email) {
      res.status(400).json({ error: 'Email wajib diisi' });
      return;
    }
    const emailClean = String(email).trim().toLowerCase();
    const user = sharedDb.usersByEmail[emailClean];

    if (user) {
      if (
        user.passwordHash &&
        user.passwordHash !== passwordHash &&
        user.passwordHash !== rawPasswordBtoa
      ) {
        res.status(401).json({ error: 'Kata sandi yang Anda masukkan tidak sesuai.' });
        return;
      }
      const bundle = findFamilyInSharedDb(user.profile?.family_id) || null;
      res.json({ user, bundle });
      return;
    }

    // Check if any family bundle on the server already has a member with this email
    for (const bundle of Object.values(sharedDb.familiesById)) {
      const matchedMember = (bundle?.members || []).find(
        (m: any) => m?.email && String(m.email).trim().toLowerCase() === emailClean
      );
      if (matchedMember && bundle?.family?.id) {
        const now = new Date().toISOString();
        const recoveredProfile = {
          id: matchedMember.user_id || matchedMember.id,
          email: emailClean,
          full_name: matchedMember.name || emailClean.split('@')[0],
          avatar_url: matchedMember.avatar_url,
          family_id: bundle.family.id,
          role: matchedMember.role || 'Pasangan',
          created_at: matchedMember.created_at || now,
          updated_at: now,
        };
        const recoveredUser = {
          id: recoveredProfile.id,
          email: emailClean,
          passwordHash,
          profile: recoveredProfile,
        };
        sharedDb.usersByEmail[emailClean] = recoveredUser;
        saveSharedDb(sharedDb);
        res.json({ user: recoveredUser, bundle });
        return;
      }
    }

    const allFamilies = Object.values(sharedDb.familiesById);
    const existingFamily = allFamilies.length > 0 ? allFamilies[0] : null;
    res.status(404).json({ user: null, bundle: null, existingFamily });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, passwordHash } = req.body || {};
    const emailClean = String(email || '').trim().toLowerCase();
    const user = sharedDb.usersByEmail[emailClean];
    if (!user) {
      res.status(404).json({ ok: false });
      return;
    }
    user.passwordHash = passwordHash;
    saveSharedDb(sharedDb);
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RumahKita server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
