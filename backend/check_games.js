const prisma = require('./src/config/db');

BigInt.prototype.toJSON = function() { return this.toString() }

async function main() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("Recent games:", JSON.stringify(games, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
