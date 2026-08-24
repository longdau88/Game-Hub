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

    this.client.on('error', err => {
      console.error('[IMAP] Background error:', err.message);
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
        console.log('[IMAP] Client not usable, re-initializing...');
        try { await this.client.logout(); } catch(e) {}
        await this.init();
        if (!this.client || !this.client.usable) {
          this.isRunning = false;
          return;
        }
      }

      let lock = await this.client.getMailboxLock('INBOX');
      try {
        const uids = [];
        
        // Search for unseen UIDs first (fast)
        const unseenUids = await this.client.search({ seen: false }, { uid: true });
        
        if (unseenUids && unseenUids.length > 0) {
          // Process at most the last 20 unseen emails to avoid connection timeouts
          const uidsToProcess = unseenUids.slice(-20);
          const processedUids = [];

          for (const uid of uidsToProcess) {
            try {
              const msg = await this.client.fetchOne(uid, { source: true }, { uid: true });
              if (!msg) continue;
              
              const parsed = await simpleParser(msg.source);
              
              const toAddresses = parsed.to?.value?.map(v => v.address?.toLowerCase()) || [];
              const ccAddresses = parsed.cc?.value?.map(v => v.address?.toLowerCase()) || [];
              const bccAddresses = parsed.bcc?.value?.map(v => v.address?.toLowerCase()) || [];
              
              const deliveredTo = parsed.headers.get('delivered-to') || '';
              const xForwardedTo = parsed.headers.get('x-forwarded-to') || '';
              const rawTo = parsed.headers.get('to') || '';
              const rawCc = parsed.headers.get('cc') || '';
              
              const allRecipients = [...toAddresses, ...ccAddresses, ...bccAddresses].join(' ') + ` ${deliveredTo} ${xForwardedTo} ${rawTo} ${rawCc}`;
              const isSupportEmail = allRecipients.toLowerCase().includes('support@game-hub.best') || allRecipients.toLowerCase().includes('support@gamehub.best');

              if (isSupportEmail) {
                // Extract useful fields
                const email = parsed.replyTo?.value[0]?.address || parsed.from?.value[0]?.address || 'unknown@example.com';
                const subject = parsed.subject || 'No Subject';
                const message = parsed.text || parsed.html || 'No Content';

                await prisma.supportTicket.create({
                  data: {
                    email,
                    subject,
                    message: message.trim(),
                    status: 'OPEN'
                  }
                });

                console.log(`[IMAP] Saved ticket from ${email}: ${subject}`);
              }
              
              processedUids.push(uid);
            } catch (parseErr) {
              console.error(`[IMAP] Failed to parse message UID ${uid}:`, parseErr);
            }
          }

          if (processedUids.length > 0) {
            await this.client.messageFlagsAdd(processedUids, ['\\Seen'], { uid: true });
            console.log(`[IMAP] Marked ${processedUids.length} messages as SEEN`);
          }
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
