async function test() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@superiorcollegemc.com', password: 'Superior2026!' })
  });
  const cookie = loginRes.headers.get('set-cookie');

  const dashRes = await fetch('http://localhost:3000/dashboard', {
    headers: { cookie }
  });
  const html = await dashRes.text();
  console.log('Dashboard status:', dashRes.status);
  const match = html.match(/Total Submission Files<\/span>[\s\S]*?<div class="text-2xl font-bold text-slate-900">(\d+)<\/div>/);
  console.log('Total Submission Files card value:', match ? match[1] : 'Not found');
  const matchSubjects = html.match(/Recognized Subjects<\/span>[\s\S]*?<div class="text-2xl font-bold text-slate-900">(\d+)<\/div>/);
  console.log('Recognized Subjects card value:', matchSubjects ? matchSubjects[1] : 'Not found');
  const matchPracticals = html.match(/Practicals Detected<\/span>[\s\S]*?<div class="text-2xl font-bold text-slate-900">\s*(\d+)\s*\/\s*(\d+)/);
  console.log('Practicals Detected card value:', matchPracticals ? `${matchPracticals[1]} / ${matchPracticals[2]}` : 'Not found');
}

test().catch(console.error);
