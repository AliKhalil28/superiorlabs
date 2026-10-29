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

async function testHierarchy() {
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

  // Load classification logic
  // Let's inspect the folders
  const FOLDER_MIME = 'application/vnd.google-apps.folder';
  const folders = allItems.filter(i => i.mimeType === FOLDER_MIME);
  const files = allItems.filter(i => i.mimeType !== FOLDER_MIME);

  console.log(`Total: ${allItems.length} items (${folders.length} folders, ${files.length} files)`);

  const itemMap = new Map();
  const childrenMap = new Map();
  for (const item of allItems) {
    itemMap.set(item.id, item);
    const parentId = item.parents?.[0] || data.root_folder_id;
    const existing = childrenMap.get(parentId) || [];
    existing.push(item.id);
    childrenMap.set(parentId, existing);
  }

  function recognizeLab(name) {
    const m = name.trim().match(/^(?:lab|practical|exp|experiment|task)\s*[-_:]?\s*(\d{1,2})/i);
    if (m) return { isPractical: true, num: parseInt(m[1], 10) };
    return { isPractical: false, num: null };
  }

  // Trace depth 1 (Programs), depth 2 (Semesters), depth 3 (Subjects), depth 4 (Practicals)
  const rootChildren = childrenMap.get(data.root_folder_id) || [];
  console.log(`Root has ${rootChildren.length} children:`);
  
  for (const rcId of rootChildren) {
    const rc = itemMap.get(rcId);
    console.log(`\nProgram / Group [Level 1]: ${rc.name} (${rc.id})`);
    const sems = childrenMap.get(rc.id) || [];
    for (const semId of sems) {
      const sem = itemMap.get(semId);
      console.log(`  -> Semester / Sub-group [Level 2]: ${sem.name} (${sem.id})`);
      const subjects = childrenMap.get(sem.id) || [];
      for (const subjId of subjects) {
        const subj = itemMap.get(subjId);
        if (subj.mimeType === FOLDER_MIME) {
          const practicals = childrenMap.get(subj.id) || [];
          console.log(`     -> Subject [Level 3]: ${subj.name} (has ${practicals.length} practical items)`);
          const practicalFolders = practicals.filter(pId => itemMap.get(pId)?.mimeType === FOLDER_MIME);
          for (const pfId of practicalFolders.slice(0, 5)) {
            const pf = itemMap.get(pfId);
            const subFiles = childrenMap.get(pf.id) || [];
            console.log(`        -> Practical [Level 4]: ${pf.name} (${subFiles.length} files)`);
          }
          if (practicalFolders.length > 5) {
            console.log(`        ... and ${practicalFolders.length - 5} more practical folders`);
          }
        }
      }
    }
  }
}

testHierarchy().catch(console.error);
