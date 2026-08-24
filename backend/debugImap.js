const { ImapFlow } = require('imapflow');
const simpleParser = require('mailparser').simpleParser;
require('dotenv').config();

async function main() {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    logger: false
  });

  client.on('error', err => {});

  await client.connect();
  let lock = await client.getMailboxLock('INBOX');
  
  try {
    const total = client.mailbox.exists;
    const start = Math.max(1, total - 3);
    const messages = client.fetch(`${start}:*`, { source: true, envelope: true }, { uid: true });
    
    for await (let msg of messages) {
      const parsed = await simpleParser(msg.source);
      console.log(`\n=== Message UID ${msg.uid} ===`);
      console.log('Subject:', parsed.subject);
      
      const toAddresses = parsed.to?.value?.map(v => v.address?.toLowerCase()) || [];
      const ccAddresses = parsed.cc?.value?.map(v => v.address?.toLowerCase()) || [];
      const bccAddresses = parsed.bcc?.value?.map(v => v.address?.toLowerCase()) || [];
      
      const deliveredTo = parsed.headers.get('delivered-to') || '';
      const xForwardedTo = parsed.headers.get('x-forwarded-to') || '';
      const rawTo = parsed.headers.get('to') || '';
      const rawCc = parsed.headers.get('cc') || '';
      
      const allRecipients = [...toAddresses, ...ccAddresses, ...bccAddresses].join(' ') + ` ${deliveredTo} ${xForwardedTo} ${rawTo} ${rawCc}`;
      
      console.log('All Recipients String:', allRecipients);
      console.log('Is Support Email?:', allRecipients.toLowerCase().includes('support@game-hub.best') || allRecipients.toLowerCase().includes('support@gamehub.best'));
    }
  } catch(e) {
      console.error(e);
  } finally {
    try { lock.release(); } catch(e){}
    try { await client.logout(); } catch(e){}
  }
}

main();
