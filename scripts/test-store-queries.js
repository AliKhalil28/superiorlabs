const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testStore() {
  console.log('--- Testing getDashboardMetrics ---');
  const { data: m } = await supabase.from('college_dashboard_metrics_view').select('*').single();
  console.log('Metrics:', m);

  console.log('--- Testing getAcademicGroups ---');
  const { data: ag } = await supabase.from('academic_group_summary_view').select('*');
  console.log('Academic groups count:', ag.length);

  console.log('--- Testing getAllSubjectSummaries ---');
  const { data: s } = await supabase.from('subject_summary_view').select('*');
  console.log('Subjects count:', s.length);
  const firstSubj = s[0];
  console.log('First subject:', firstSubj);

  console.log('--- Testing practicals for first subject ---');
  const { data: p } = await supabase
    .from('practical_folders')
    .select('id, name, practical_number, drive_folder_id, drive_modified_time, submission_files(id, drive_file_id, is_trashed)')
    .eq('subject_id', firstSubj.subject_id);
  console.log('Practicals for', firstSubj.subject_name, ':', p.length);
  p.forEach(pr => console.log('  Lab:', pr.name, 'Files:', pr.submission_files?.length));

  if (p.length > 0) {
    const firstP = p[0];
    console.log('--- Testing files for practical', firstP.name, '---');
    const { data: f } = await supabase
      .from('submission_files')
      .select('*')
      .eq('practical_folder_id', firstP.id);
    console.log('Files count:', f.length);
    console.log('Sample file:', f[0]);
  }
}

testStore().catch(console.error);
