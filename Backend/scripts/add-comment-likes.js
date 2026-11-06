const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS community_comment_likes (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "commentId" TEXT NOT NULL REFERENCES community_post_comments(id) ON DELETE CASCADE,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT community_comment_likes_commentId_userId_key UNIQUE ("commentId", "userId")
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS community_comment_likes_commentId_idx ON community_comment_likes("commentId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS community_comment_likes_userId_idx ON community_comment_likes("userId");
  `);
  console.log('Successfully created community_comment_likes table and indexes');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

