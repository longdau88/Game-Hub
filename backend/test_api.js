const jwt = require('jsonwebtoken');

const JWT_SECRET = 'supersecretkey123';
const token = jwt.sign({ userId: 4, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

async function check() {
  try {
    const res = await fetch('http://127.0.0.1:4000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status:', res.status);
    const data = await res.text();
    console.log('Data:', data);
  } catch (e) {
    console.error(e);
  }
}
check();
