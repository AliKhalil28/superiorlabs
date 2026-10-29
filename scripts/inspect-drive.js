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

  // SE 3rd: 12vYdbueQAYrCY0_mylvQaNnnmCnSiR6A
  const subjects = await drive.files.list({
    q: `"12vYdbueQAYrCY0_mylvQaNnnmCnSiR6A" in parents and trashed = false`,
    fields: 'files(id, name, mimeType)'
  });
  console.log(`Children of SE 3rd:`);
  for (const s of subjects.data.files) {
    console.log(` - [${s.mimeType}] ${s.name} (${s.id})`);
    if (s.mimeType === 'application/vnd.google-apps.folder') {
      const practicals = await drive.files.list({
        q: `"${s.id}" in parents and trashed = false`,
        fields: 'files(id, name, mimeType)'
      });
      for (const p of practicals.data.files) {
        console.log(`     -> [${p.mimeType}] ${p.name}`);
      }
    }
  }
}
testDrive().catch(console.error);
