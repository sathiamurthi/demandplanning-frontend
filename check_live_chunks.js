const https = require('https');
const htmlReq = https.get('https://www.demandgeniusai.com/admin/dashboard', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const regex = /_next\/static\/chunks\/[a-zA-Z0-9\-_/\.]+\.js/g;
    const matches = [...new Set(body.match(regex))];
    console.log(`Found ${matches.length} JS chunks`);
    
    let found = false;
    let checked = 0;
    
    if (matches.length === 0) {
      console.log('No chunks found. Exiting.');
      return;
    }

    matches.forEach(match => {
      const url = `https://www.demandgeniusai.com/${match}`;
      https.get(url, (chunkRes) => {
        let chunkBody = '';
        chunkRes.on('data', c => chunkBody += c);
        chunkRes.on('end', () => {
          checked++;
          if (chunkBody.includes('HR & Staff') || chunkBody.includes('attendanceConfig')) {
            console.log(`[SUCCESS] Found new code in chunk: ${url}`);
            found = true;
          }
          if (checked === matches.length) {
            if (!found) console.log('[FAIL] New code NOT found in any chunks!');
          }
        });
      });
    });
  });
});
