const app = require('express')();
const authRouter = require('../services/auth-service');
app.use(require('express').json());
app.use('/api/auth', authRouter);

const server = app.listen(3335, async () => {
  try {
    const actors = [
      { u: 'customer', p: '1' },
      { u: 'admin', p: '2' },
      { u: 'staff', p: '3' },
      { u: 'manager', p: '4' },
      { u: 'business', p: '5' }
    ];
    for (const a of actors) {
      const res = await fetch('http://localhost:3335/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: a.u, password: a.p })
      });
      const data = await res.json();
      console.log(`[AUTH TEST] ${a.u} / ${a.p} => Success: ${data.success}, Name: ${data.data.name}, Role: ${data.data.role}`);
    }
    server.close();
    process.exit(0);
  } catch (e) {
    console.error(e);
    server.close();
    process.exit(1);
  }
});
