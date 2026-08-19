const prisma = require('./src/config/db.js');

async function main() {
  await prisma.notification.updateMany({
    where: {
      type: { in: ['FRIEND_REQUEST', 'FRIEND_ACCEPTED'] },
      link: '/profile'
    },
    data: {
      link: '/friends'
    }
  });

  const followerNotifs = await prisma.notification.findMany({
    where: {
      type: 'NEW_FOLLOWER',
      link: '/profile'
    }
  });

  for (const notif of followerNotifs) {
    let username = '';
    try {
      const data = JSON.parse(notif.message);
      username = data.params?.username;
    } catch(e) {
      const match = notif.message.match(/^(.*?) started following you/);
      if (match) username = match[1];
    }
    
    if (username) {
      const user = await prisma.user.findUnique({ where: { username } });
      if (user) {
        await prisma.notification.update({
          where: { id: notif.id },
          data: { link: `/creator/${user.id}` }
        });
      }
    }
  }
  console.log('Fixed old notification links!');
}

main().catch(console.error).finally(() => process.exit(0));
