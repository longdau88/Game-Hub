const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const r2Client = require('./src/config/r2');
const prisma = require('./src/config/db');

async function main() {
  try {
    let serverBytes = 0;
    let isTruncated = true;
    let continuationToken = undefined;

    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME || 'webgame-assets',
        ContinuationToken: continuationToken
      });
      
      const response = await r2Client.send(command);
      if (response.Contents) {
        response.Contents.forEach(item => {
          serverBytes += item.Size || 0;
        });
      }
      isTruncated = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    }
    console.log('R2 BUCKET SIZE:', serverBytes);

    let dbBytes = 0;
    const result = await prisma.$queryRaw`SELECT pg_database_size(current_database())::text as size`;
    dbBytes = Number(result[0].size) || 0;
    console.log('DB SIZE:', dbBytes);

  } catch(e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
