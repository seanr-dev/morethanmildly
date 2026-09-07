import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readdir, readFile } from 'node:fs/promises';
import {
  articleInput,
  categoryInput,
  validPushEndpoint,
} from '../src/lib/validation';
import { notificationWindow } from '../src/lib/notification-schedule';
import { launchArticles, launchCategories } from '../src/data/launch-content';

test('launch articles satisfy the same validation as the editor', () => {
  for (const article of launchArticles)
    assert.equal(articleInput.safeParse(article).success, true, article.title);
  for (const category of launchCategories)
    assert.equal(
      categoryInput.safeParse(category).success,
      true,
      category.name,
    );
  assert.equal(
    articleInput.safeParse({ ...launchArticles[0], primaryCategoryId: '' })
      .success,
    false,
  );
  assert.equal(
    articleInput.safeParse({
      ...launchArticles[0],
      inlineImages: Array.from({ length: 4 }, () => ({
        ...launchArticles[0].headerImage,
        afterBlock: 0,
      })),
    }).success,
    false,
  );
  assert.equal(
    articleInput.safeParse({
      ...launchArticles[0],
      headerImage: { url: 'javascript:alert(1)', alt: 'Unsafe' },
    }).success,
    false,
  );
});
test('notification windows follow local time, including DST and quarter-hour offsets', () => {
  assert.deepEqual(
    notificationWindow('America/Edmonton', new Date('2026-07-01T14:00:00Z')),
    { period: 'morning', localDate: '2026-07-01' },
  );
  assert.deepEqual(
    notificationWindow('America/Edmonton', new Date('2026-12-01T15:00:00Z')),
    { period: 'morning', localDate: '2026-12-01' },
  );
  assert.deepEqual(
    notificationWindow('Asia/Kathmandu', new Date('2026-09-06T07:15:00Z')),
    { period: 'afternoon', localDate: '2026-09-06' },
  );
  assert.deepEqual(
    notificationWindow('Pacific/Auckland', new Date('2026-09-05T20:00:00Z')),
    { period: 'morning', localDate: '2026-09-06' },
  );
  assert.equal(
    notificationWindow('UTC', new Date('2026-09-06T03:00:00Z')),
    null,
  );
});
test('push destinations reject local networks and lookalike hosts', () => {
  assert.equal(
    validPushEndpoint('https://fcm.googleapis.com/fcm/send/example'),
    true,
  );
  assert.equal(validPushEndpoint('https://web.push.apple.com/example'), true);
  for (const value of [
    'http://fcm.googleapis.com/x',
    'https://127.0.0.1/x',
    'https://localhost/x',
    'https://fcm.googleapis.com.attacker.example/x',
    'https://fcm.googleapis.com:8000/x',
    'https://name:password@fcm.googleapis.com/x',
  ])
    assert.equal(validPushEndpoint(value), false, value);
});
test('SQL migrations enforce editorial rules, likes, and notification deduplication', async () => {
  const require = createRequire(import.meta.resolve('@netlify/database-dev'));
  const { PGlite } = await import(require.resolve('@electric-sql/pglite'));
  const database = new PGlite();
  try {
    const directories = (
      await readdir('netlify/database/migrations', { withFileTypes: true })
    )
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const name of directories)
      await database.exec(
        await readFile(
          `netlify/database/migrations/${name}/migration.sql`,
          'utf8',
        ),
      );
    const count = await database.query(
      'SELECT count(*)::int AS count FROM articles',
    );
    assert.equal(count.rows[0].count, 16);
    const article = launchArticles[0];
    const secondary = launchCategories.find((c) => c.type === 'secondary')!;
    await assert.rejects(
      database.query(
        'UPDATE articles SET primary_category_id = $1 WHERE id = $2',
        [secondary.id, article.id],
      ),
    );
    await assert.rejects(
      database.query('UPDATE categories SET type = $1 WHERE id = $2', [
        'secondary',
        article.primaryCategoryId,
      ]),
    );
    await assert.rejects(
      database.query('DELETE FROM categories WHERE id = $1', [
        article.primaryCategoryId,
      ]),
    );
    await assert.rejects(
      database.query('UPDATE articles SET likes = -1 WHERE id = $1', [
        article.id,
      ]),
    );
    await database.query(
      'INSERT INTO article_likes(article_id, visitor_hash) VALUES ($1, $2)',
      [article.id, 'test-visitor'],
    );
    await assert.rejects(
      database.query(
        'INSERT INTO article_likes(article_id, visitor_hash) VALUES ($1, $2)',
        [article.id, 'test-visitor'],
      ),
    );
    const sub = await database.query(
      "INSERT INTO push_subscriptions(endpoint,p256dh,auth,visitor_hash,time_zone) VALUES ('https://fcm.googleapis.com/test','key','auth','visitor','UTC') RETURNING id",
    );
    await database.query(
      "INSERT INTO notification_deliveries(subscription_id,local_date,period) VALUES ($1,'2026-09-06','morning')",
      [sub.rows[0].id],
    );
    await assert.rejects(
      database.query(
        "INSERT INTO notification_deliveries(subscription_id,local_date,period) VALUES ($1,'2026-09-06','morning')",
        [sub.rows[0].id],
      ),
    );
    await database.query('DELETE FROM articles WHERE id=$1', [article.id]);
    const likes = await database.query(
      'SELECT count(*)::int AS count FROM article_likes',
    );
    assert.equal(likes.rows[0].count, 0);
    const created = await database.query(
      "INSERT INTO categories(name,slug,type,description) VALUES ('Test','test','primary','Test category') RETURNING id",
    );
    await database.query("UPDATE categories SET name='Updated' WHERE id=$1", [
      created.rows[0].id,
    ]);
    await database.query('DELETE FROM categories WHERE id=$1', [
      created.rows[0].id,
    ]);
  } finally {
    await database.close();
  }
});
