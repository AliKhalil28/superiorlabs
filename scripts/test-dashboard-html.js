async function test() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@superiorcollegemc.com', password: 'Superior2026!' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login cookie received:', Boolean(cookie));

  const dashRes = await fetch('http://localhost:3000/dashboard', {
    headers: { cookie }
  });
  const html = await dashRes.text();
  console.log('Dashboard status:', dashRes.status);
  console.log('Contains Mobile Application Development:', html.includes('Mobile Application Development'));
  console.log('Contains BSCS - CS 5th:', html.includes('BSCS - CS 5th'));
  console.log('Contains Digital Image Processing:', html.includes('Digital Image Processing'));
  console.log('Contains total files 774:', html.includes('774'));
  console.log('Contains total subjects 25:', html.includes('25'));
}

test().catch(console.error);
