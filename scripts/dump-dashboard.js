async function test() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@superiorcollegemc.com', password: 'Superior2026!' })
  });
  const cookies = loginRes.headers.getSetCookie();
  const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

  const dashRes = await fetch('http://localhost:3000/dashboard', {
    headers: { cookie: cookieHeader }
  });
  const html = await dashRes.text();
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  console.log('Contains Mobile Application Development:', html.includes('Mobile Application Development'));
  console.log('Contains BSCS - CS 5th:', html.includes('BSCS - CS 5th'));
  console.log('Contains Digital Image Processing:', html.includes('Digital Image Processing'));
  console.log('Contains 774 files:', html.includes('774'));
  console.log('Contains 25 subjects:', html.includes('25'));
  console.log('\nPreview of rendered text:');
  console.log(text.slice(0, 800));
}

test().catch(console.error);
