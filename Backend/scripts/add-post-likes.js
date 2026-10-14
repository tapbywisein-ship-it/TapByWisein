const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS community_post_likes (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "postId" TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT community_post_likes_postId_userId_key UNIQUE ("postId", "userId")
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS community_post_likes_postId_idx ON community_post_likes("postId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS community_post_likes_userId_idx ON community_post_likes("userId");
  `);
  console.log('Successfully created community_post_likes table and indexes');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
