const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const prisma = require('../config/db');

class ImapService {
  constructor() {
    this.client = null;
    this.isRunning = false;
  }

  async init() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.warn('[IMAP] EMAIL_USER or EMAIL_PASS not set. IMAP sync disabled.');
      return;
    }

    this.client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: { user, pass },
      logger: false // Set to true for debugging
    });

    try {
      await this.client.connect();
      console.log('[IMAP] Connected to Gmail IMAP successfully');
    } catch (err) {
      console.error('[IMAP] Connection failed:', err.message);
      this.client = null;
    }
  }

  async syncUnreadEmails() {
    if (!this.client) return;
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // Connect if disconnected
      if (!this.client.usable) {
        await this.client.connect();
      }

      let lock = await this.client.getMailboxLock('INBOX');
      try {
        const uids = [];
        
        // Fetch all UNSEEN emails
        for await (let msg of this.client.fetch({ seen: false }, { source: true, uid: true })) {
          try {
            const parsed = await simpleParser(msg.source);
            
            // Extract useful fields
            const email = parsed.from?.value[0]?.address || 'unknown@example.com';
            const subject = parsed.subject || 'No Subject';
            const message = parsed.text || parsed.html || 'No Content';

            // Check if ticket already exists (idempotency by message-id if possible, but simplest is just by insertion time since we mark SEEN)
            await prisma.supportTicket.create({
              data: {
                email,
                subject,
                message: message.trim(),
                status: 'OPEN'
              }
            });

            console.log(`[IMAP] Saved ticket from ${email}: ${subject}`);
            uids.push(msg.uid);
          } catch (parseErr) {
            console.error('[IMAP] Failed to parse message:', parseErr);
          }
        }

        // Mark all fetched as SEEN
        if (uids.length > 0) {
          await this.client.messageFlagsAdd(uids, ['\\Seen'], { uid: true });
          console.log(`[IMAP] Marked ${uids.length} messages as SEEN`);
        }

      } finally {
        lock.release();
      }
    } catch (err) {
      console.error('[IMAP] Sync failed:', err.message);
    } finally {
      this.isRunning = false;
    }
  }
}

module.exports = new ImapService();
