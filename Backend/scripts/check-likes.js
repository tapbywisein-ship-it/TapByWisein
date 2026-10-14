const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const p = new PrismaClient();

async function test() {
  const posts = await p.$queryRawUnsafe('SELECT * FROM community_posts LIMIT 5');
  console.log('Posts:', posts);
  if (posts.length > 0) {
    const post = posts[0];
    const user = await p.$queryRawUnsafe('SELECT id, email FROM users WHERE id = $1', post.authorId);
    console.log('Post author:', user);
    const members = await p.$queryRawUnsafe('SELECT * FROM community_members WHERE "communityId" = $1', post.communityId);
    console.log('Members:', members);
    const comm = await p.$queryRawUnsafe('SELECT * FROM communities WHERE id = $1', post.communityId);
    console.log('Community:', comm);
  }
}

test()
  .catch(console.error)
  .finally(() => p.$disconnect());

