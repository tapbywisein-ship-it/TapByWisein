const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testToggleLike() {
  const postId = '4d1e8a97-721f-47c7-9bf7-3b0c81c21606';
  const userId = '6c621e04-fc32-41b8-a1da-f3b82ed4a72e';

  console.log('Testing raw queries with parameters:');
  const existing = await prisma.$queryRawUnsafe(
    'SELECT id FROM community_post_likes WHERE "postId" = $1 AND "userId" = $2 LIMIT 1',
    postId,
    userId
  );
  console.log('Existing:', existing);

  if (existing.length > 0) {
    await prisma.$executeRawUnsafe(
      'DELETE FROM community_post_likes WHERE "postId" = $1 AND "userId" = $2',
      postId,
      userId
    );
    console.log('Deleted');
  } else {
    await prisma.$executeRawUnsafe(
      'INSERT INTO community_post_likes (id, "postId", "userId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
      postId,
      userId
    );
    console.log('Inserted');
  }

  const countRes = await prisma.$queryRawUnsafe(
    'SELECT COUNT(*)::int as count FROM community_post_likes WHERE "postId" = $1',
    postId
  );
  console.log('Count:', countRes);
}

testToggleLike()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

