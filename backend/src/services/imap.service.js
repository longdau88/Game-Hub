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
        
        const totalMessages = this.client.mailbox.exists;
        
        if (totalMessages > 0) {
          // Lấy 20 email mới nhất (bất kể đã đọc hay chưa đọc)
          const startSeq = Math.max(1, totalMessages - 20);
          
          // Chỉ fetch UID trước để lấy danh sách
          const uidsToProcess = [];
          for await (let msg of this.client.fetch(`${startSeq}:*`, { uid: true })) {
            uidsToProcess.push(msg.uid);
          }

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
                const message = (parsed.text || parsed.html || 'No Content').trim();

                // Kiểm tra xem ticket này đã tồn tại trong DB chưa để tránh trùng lặp
                const existingTicket = await prisma.supportTicket.findFirst({
                  where: { email, subject, message }
                });

                if (!existingTicket) {
                  await prisma.supportTicket.create({
                    data: {
                      email,
                      subject,
                      message,
                      status: 'OPEN'
                    }
                  });
                  console.log(`[IMAP] Saved ticket from ${email}: ${subject}`);
                }
              }
              
              processedUids.push(uid);
            } catch (parseErr) {
              console.error(`[IMAP] Failed to parse message UID ${uid}:`, parseErr);
            }
          }

          if (processedUids.length > 0) {
            // Vẫn nên mark là SEEN để đồng bộ trạng thái đọc trên Gmail
            await this.client.messageFlagsAdd(processedUids, ['\\Seen'], { uid: true });
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
