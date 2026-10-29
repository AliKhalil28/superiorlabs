const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');
const crypto = require('crypto');

function decryptToken(encrypted) {
  const key = Buffer.from(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY, 'hex');
  const [ivHex, authTagHex, encryptedDataHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function recognizePracticalFolderName(name) {
  const clean = name.trim();
  const labPattern = /^(?:lab|practical|exp|experiment|task)\s*[-_:]?\s*(\d{1,2})(?:\s+.*)?$/i;
  const match = clean.match(labPattern);
  if (match) {
    const num = parseInt(match[1], 10);
    return { isPractical: true, practicalNumber: num, confidence: 0.95 };
  }
  const embeddedPattern = /(?:^|\s)(?:lab|practical)\s*[-_:]?\s*(\d{1,2})\b/i;
  const embeddedMatch = clean.match(embeddedPattern);
  if (embeddedMatch) {
    const num = parseInt(embeddedMatch[1], 10);
    return { isPractical: true, practicalNumber: num, confidence: 0.85 };
  }
  return { isPractical: false, practicalNumber: null, confidence: 0.0 };
}

async function testClassify() {
  const { data } = await supabase.from('drive_connections').select('*').single();
  const refreshToken = decryptToken(data.encrypted_refresh_token);
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const allItems = [];
  let pageToken = undefined;
  while (true) {
    const res = await drive.files.list({
      pageSize: 1000,
      fields: 'nextPageToken, files(id, name, mimeType, parents, modifiedTime, size, webViewLink, trashed)',
      q: 'trashed = false',
      pageToken,
    });
    allItems.push(...(res.data.files || []));
    if (!res.data.nextPageToken) break;
    pageToken = res.data.nextPageToken;
  }

  const FOLDER_MIME = 'application/vnd.google-apps.folder';
  const itemMap = new Map();
  const childrenMap = new Map();

  for (const item of allItems) {
    itemMap.set(item.id, item);
    const parentId = item.parents?.[0] || data.root_folder_id;
    const existing = childrenMap.get(parentId) || [];
    existing.push(item.id);
    childrenMap.set(parentId, existing);
  }

  // We want to classify:
  // 1. Academic Groups (BSSE, BSCS, BSIT, and their semesters: SE 3rd, SE 5th, CS 3rd, CS 5th, CS 7th, IT 3rd, IT 5th, IT 7th)
  // 2. Subjects (under semesters, containing practical folders or being courses)
  // 3. Practicals (Lab 1..10)
  // 4. Submission Files (inside practical folders)

  console.log(`Starting classification of ${allItems.length} items...`);

  // Let's inspect which top-level items under root are actual academic folders
  const academicRoots = ['BSSE', 'BSCS', 'BSIT'];
  const rootChildren = childrenMap.get(data.root_folder_id) || [];
  
  const relevantAcademicFolders = rootChildren
    .map(id => itemMap.get(id))
    .filter(item => item && item.mimeType === FOLDER_MIME && academicRoots.some(r => item.name.toUpperCase().includes(r)));

  console.log(`Academic Root Folders identified:`, relevantAcademicFolders.map(f => f.name));
}

testClassify().catch(console.error);

