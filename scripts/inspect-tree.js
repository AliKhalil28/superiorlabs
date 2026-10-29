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

async function testDrive() {
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

  console.log(`Total items fetched from Drive: ${allItems.length}`);
  const folders = allItems.filter(i => i.mimeType === 'application/vnd.google-apps.folder');
  const files = allItems.filter(i => i.mimeType !== 'application/vnd.google-apps.folder');
  console.log(`Folders: ${folders.length}, Files: ${files.length}`);

  // Let's print out the folder names and their parents to understand the tree
  const folderMap = new Map();
  folders.forEach(f => folderMap.set(f.id, f));

  function getPath(f) {
    let curr = f;
    const parts = [f.name];
    while (curr.parents && curr.parents[0] && folderMap.has(curr.parents[0])) {
      curr = folderMap.get(curr.parents[0]);
      parts.unshift(curr.name);
    }
    return parts.join(' / ');
  }

  const samplePaths = folders.slice(0, 35).map(f => getPath(f));
  console.log('Sample Folder Paths:');
  samplePaths.forEach(p => console.log('  ', p));
}

testDrive().catch(console.error);
