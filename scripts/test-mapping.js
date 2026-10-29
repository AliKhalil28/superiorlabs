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

function recognizeLab(name) {
  const clean = name.trim();
  const labPattern = /^(?:lab|practical|exp|experiment|task)\s*[-_:]?\s*(\d{1,2})(?:\s+.*)?$/i;
  const match = clean.match(labPattern);
  if (match) {
    return { isPractical: true, practicalNumber: parseInt(match[1], 10) };
  }
  const embeddedPattern = /(?:^|\s)(?:lab|practical)\s*[-_:]?\s*(\d{1,2})\b/i;
  const embeddedMatch = clean.match(embeddedPattern);
  if (embeddedMatch) {
    return { isPractical: true, practicalNumber: parseInt(embeddedMatch[1], 10) };
  }
  return { isPractical: false, practicalNumber: null };
}

async function runMappingTest() {
  const { data: conn } = await supabase.from('drive_connections').select('*').single();
  const refreshToken = decryptToken(conn.encrypted_refresh_token);
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
    const parentId = item.parents?.[0] || conn.root_folder_id;
    const existing = childrenMap.get(parentId) || [];
    existing.push(item.id);
    childrenMap.set(parentId, existing);
  }

  const academicGroups = [];
  const subjects = [];
  const practicalFolders = [];
  const submissionFiles = [];

  // Traverse starting from academic programs (BSSE, BSCS, BSIT)
  const rootChildren = childrenMap.get(conn.root_folder_id) || [];
  const programFolders = rootChildren
    .map(id => itemMap.get(id))
    .filter(item => item && item.mimeType === FOLDER_MIME && ['BSSE', 'BSCS', 'BSIT'].some(p => item.name.toUpperCase().includes(p)));

  for (const prog of programFolders) {
    const progCleanName = prog.name.trim();
    const semFolderIds = childrenMap.get(prog.id) || [];

    for (const semId of semFolderIds) {
      const sem = itemMap.get(semId);
      if (!sem || sem.mimeType !== FOLDER_MIME) continue;

      const semCleanName = sem.name.trim();
      const groupName = `${progCleanName} - ${semCleanName}`;
      
      academicGroups.push({
        drive_folder_id: sem.id,
        name: groupName,
        relative_path: `${progCleanName} / ${semCleanName}`,
      });

      const subjectFolderIds = childrenMap.get(sem.id) || [];
      for (const subjId of subjectFolderIds) {
        const subj = itemMap.get(subjId);
        if (!subj || subj.mimeType !== FOLDER_MIME) continue;

        const subjCleanName = subj.name.trim();
        subjects.push({
          drive_folder_id: subj.id,
          name: subjCleanName,
          parent_sem_id: sem.id,
          groupName: groupName,
          expected_practicals: 10,
        });

        const practicalItemIds = childrenMap.get(subj.id) || [];
        for (const pId of practicalItemIds) {
          const p = itemMap.get(pId);
          if (!p) continue;

          if (p.mimeType === FOLDER_MIME) {
            const labRec = recognizeLab(p.name);
            practicalFolders.push({
              drive_folder_id: p.id,
              name: p.name.trim(),
              parent_subj_id: subj.id,
              practical_number: labRec.practicalNumber || 1,
              classification_status: labRec.isPractical ? 'identified' : 'unmatched',
              drive_modified_time: p.modifiedTime,
            });

            const fileIds = childrenMap.get(p.id) || [];
            for (const fId of fileIds) {
              const f = itemMap.get(fId);
              if (!f || f.mimeType === FOLDER_MIME) continue;

              const extMatch = f.name.match(/\.([0-9a-z]+)$/i);
              submissionFiles.push({
                drive_file_id: f.id,
                practical_drive_folder_id: p.id,
                name: f.name.trim(),
                extension: extMatch ? extMatch[1].toLowerCase() : null,
                mime_type: f.mimeType,
                file_size: f.size ? parseInt(f.size, 10) : null,
                web_view_link: f.webViewLink || null,
                drive_modified_time: f.modifiedTime || null,
              });
            }
          }
        }
      }
    }
  }

  console.log(`\n=== EXTRACTED STATISTICS ===`);
  console.log(`Academic Groups: ${academicGroups.length}`);
  academicGroups.forEach(g => console.log(`  - ${g.name}`));
  console.log(`\nSubjects: ${subjects.length}`);
  subjects.slice(0, 10).forEach(s => console.log(`  - ${s.name} (${s.groupName})`));
  console.log(`\nPractical Folders: ${practicalFolders.length}`);
  console.log(`Submission Files: ${submissionFiles.length}`);
}

runMappingTest().catch(console.error);
