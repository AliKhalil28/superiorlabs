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

async function runSyncToDb() {
  console.log('Fetching drive connection from Supabase...');
  const { data: conn } = await supabase.from('drive_connections').select('*').single();
  const refreshToken = decryptToken(conn.encrypted_refresh_token);
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  console.log('Fetching all files from Google Drive...');
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
  console.log(`Fetched ${allItems.length} items from Drive.`);

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

  // 1. Process Academic Groups (Semesters under BSSE, BSCS, BSIT or any top-level academic folder)
  const rootChildren = childrenMap.get(conn.root_folder_id) || [];
  const programFolders = rootChildren
    .map(id => itemMap.get(id))
    .filter(item => item && item.mimeType === FOLDER_MIME && ['BSSE', 'BSCS', 'BSIT'].some(p => item.name.toUpperCase().includes(p)));

  console.log('Inserting Academic Groups...');
  const groupsToInsert = [];
  const semToSubjMap = new Map();

  for (const prog of programFolders) {
    const progCleanName = prog.name.trim();
    const semFolderIds = childrenMap.get(prog.id) || [];

    for (const semId of semFolderIds) {
      const sem = itemMap.get(semId);
      if (!sem || sem.mimeType !== FOLDER_MIME) continue;

      const semCleanName = sem.name.trim();
      const groupName = `${progCleanName} - ${semCleanName}`;
      
      groupsToInsert.push({
        drive_folder_id: sem.id,
        name: groupName,
        relative_path: `${progCleanName} / ${semCleanName}`,
      });

      semToSubjMap.set(sem.id, childrenMap.get(sem.id) || []);
    }
  }

  const { data: insertedGroups, error: groupErr } = await supabase
    .from('academic_groups')
    .upsert(groupsToInsert, { onConflict: 'drive_folder_id' })
    .select('id, drive_folder_id');

  if (groupErr) throw new Error('Groups error: ' + groupErr.message);
  console.log(`Upserted ${insertedGroups.length} Academic Groups.`);

  const groupIdMap = new Map();
  insertedGroups.forEach(g => groupIdMap.set(g.drive_folder_id, g.id));

  // 2. Process Subjects
  console.log('Inserting Subjects...');
  const subjectsToInsert = [];
  const subjToPracticalMap = new Map();

  for (const [semId, subjIds] of semToSubjMap.entries()) {
    const academicGroupId = groupIdMap.get(semId);
    for (const subjId of subjIds) {
      const subj = itemMap.get(subjId);
      if (!subj || subj.mimeType !== FOLDER_MIME) continue;

      subjectsToInsert.push({
        drive_folder_id: subj.id,
        name: subj.name.trim(),
        academic_group_id: academicGroupId,
        expected_practicals: 10,
      });

      subjToPracticalMap.set(subj.id, childrenMap.get(subj.id) || []);
    }
  }

  const { data: insertedSubjects, error: subjErr } = await supabase
    .from('subjects')
    .upsert(subjectsToInsert, { onConflict: 'drive_folder_id' })
    .select('id, drive_folder_id');

  if (subjErr) throw new Error('Subjects error: ' + subjErr.message);
  console.log(`Upserted ${insertedSubjects.length} Subjects.`);

  const subjIdMap = new Map();
  insertedSubjects.forEach(s => subjIdMap.set(s.drive_folder_id, s.id));

  // 3. Process Practical Folders
  console.log('Inserting Practical Folders...');
  const practicalsToInsert = [];
  const practicalToFileMap = new Map();

  for (const [subjDriveId, pIds] of subjToPracticalMap.entries()) {
    const subjectId = subjIdMap.get(subjDriveId);
    for (const pId of pIds) {
      const p = itemMap.get(pId);
      if (!p || p.mimeType !== FOLDER_MIME) continue;

      const labRec = recognizeLab(p.name);
      practicalsToInsert.push({
        drive_folder_id: p.id,
        name: p.name.trim(),
        subject_id: subjectId,
        practical_number: labRec.practicalNumber || 1,
        classification_status: labRec.isPractical ? 'identified' : 'unmatched',
        drive_modified_time: p.modifiedTime || new Date().toISOString(),
      });

      practicalToFileMap.set(p.id, childrenMap.get(p.id) || []);
    }
  }

  const { data: insertedPracticals, error: pErr } = await supabase
    .from('practical_folders')
    .upsert(practicalsToInsert, { onConflict: 'drive_folder_id' })
    .select('id, drive_folder_id');

  if (pErr) throw new Error('Practicals error: ' + pErr.message);
  console.log(`Upserted ${insertedPracticals.length} Practical Folders.`);

  const practicalIdMap = new Map();
  insertedPracticals.forEach(p => practicalIdMap.set(p.drive_folder_id, p.id));

  // 4. Process Submission Files in batches
  console.log('Inserting Submission Files...');
  const filesToInsert = [];
  for (const [pDriveId, fileIds] of practicalToFileMap.entries()) {
    const practicalFolderId = practicalIdMap.get(pDriveId);
    for (const fId of fileIds) {
      const f = itemMap.get(fId);
      if (!f || f.mimeType === FOLDER_MIME) continue;

      const extMatch = f.name.match(/\.([0-9a-z]+)$/i);
      filesToInsert.push({
        drive_file_id: f.id,
        practical_folder_id: practicalFolderId,
        name: f.name.trim(),
        extension: extMatch ? extMatch[1].toLowerCase() : null,
        mime_type: f.mimeType,
        file_size: f.size ? parseInt(f.size, 10) : null,
        web_view_link: f.webViewLink || null,
        drive_modified_time: f.modifiedTime || new Date().toISOString(),
      });
    }
  }

  console.log(`Total files to insert: ${filesToInsert.length}`);
  // Batch in chunks of 200
  const CHUNK_SIZE = 200;
  let totalInsertedFiles = 0;
  for (let i = 0; i < filesToInsert.length; i += CHUNK_SIZE) {
    const chunk = filesToInsert.slice(i, i + CHUNK_SIZE);
    const { data: insertedChunk, error: fErr } = await supabase
      .from('submission_files')
      .upsert(chunk, { onConflict: 'drive_file_id' })
      .select('id');
    if (fErr) throw new Error('Files error: ' + fErr.message);
    totalInsertedFiles += insertedChunk.length;
  }
  console.log(`Upserted ${totalInsertedFiles} Submission Files.`);

  // 5. Check Views now
  console.log('\n=== LIVE SUPABASE VIEW RESULTS ===');
  const { data: metrics } = await supabase.from('college_dashboard_metrics_view').select('*').single();
  console.log('Dashboard Metrics View:');
  console.log(metrics);

  const { data: subjectsSummary } = await supabase.from('subject_summary_view').select('subject_name, academic_group_name, practical_folders_detected, populated_practical_folders, total_submission_files').limit(5);
  console.log('\nTop 5 Subjects in View:');
  console.log(subjectsSummary);
}

runSyncToDb().catch(console.error);

