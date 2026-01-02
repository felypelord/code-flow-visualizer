import https from 'https';

function req(method, url, data=null, headers={}){
  return new Promise((resolve, reject)=>{
    const u = new URL(url);
    const opts = {
      method,
      hostname: u.hostname,
      port: u.port || (u.protocol==='https:'?443:80),
      path: u.pathname + u.search,
      headers: Object.assign({}, headers)
    };
    const r = https.request(opts, res=>{
      let body = '';
      res.on('data', c=> body += c);
      res.on('end', ()=>{
        let parsed = null;
        try { parsed = JSON.parse(body); } catch(e) { parsed = body; }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    r.on('error', reject);
    if (data) r.write(typeof data === 'string' ? data : JSON.stringify(data));
    r.end();
  });
}

(async ()=>{
  const base = process.env.BASE || 'https://www.codeflowbr.site';
  try{
    console.log('POST /api/complete-signup');
    const signupPayload = { name: 'Smoke User', email: 'smoke+run@example.com', password: 'StrongPassw0rd!', dateOfBirth: '2000-01-01T00:00:00.000Z', country: 'US' };
    const s = await req('POST', base + '/api/complete-signup', signupPayload, { 'Content-Type': 'application/json' });
    console.log('-> status', s.status);
    console.log(JSON.stringify(s.body, null, 2));

    const token = (s.body && s.body.token) || null;
    if (!token) {
      console.error('No token returned; aborting auth tests');
    } else {
      const auth = { 'Authorization': 'Bearer ' + token };
      console.log('\nGET /api/me');
      const me = await req('GET', base + '/api/me', null, auth);
      console.log('-> status', me.status);
      console.log(JSON.stringify(me.body, null, 2));

      console.log('\nGET /api/coins/balance');
      const coins = await req('GET', base + '/api/coins/balance', null, auth);
      console.log('-> status', coins.status);
      console.log(JSON.stringify(coins.body, null, 2));
    }

    console.log('\nGET /api/store/public');
    const store = await req('GET', base + '/api/store/public');
    console.log('-> status', store.status);
    console.log(JSON.stringify(store.body, null, 2));

    console.log('\nGET /api/_diag');
    const diag = await req('GET', base + '/api/_diag');
    console.log('-> status', diag.status);
    console.log(JSON.stringify(diag.body, null, 2));

    process.exit(0);
  } catch (e){
    console.error('ERROR', e);
    process.exit(2);
  }
})();
