const prisma = require('./src/config/db.js');

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true } });
  console.log('All users:', users);
}

main().catch(console.error).finally(() => process.exit(0));
