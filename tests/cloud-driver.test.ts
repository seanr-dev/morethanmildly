import test from 'node:test';
import assert from 'node:assert/strict';
import { neonConfig } from '@neondatabase/serverless';
import { getDatabase } from '@netlify/database';
import { eq } from 'drizzle-orm';
import { createPublicationDatabase } from '../src/db/client';
import { categories } from '../src/db/schema';

test('cloud Drizzle queries use the current Neon API and preserve SQL parameters', async () => {
  const previousDriver = process.env.NETLIFY_DB_DRIVER;
  const previousFetch = neonConfig.fetchFunction;
  process.env.NETLIFY_DB_DRIVER = 'serverless';
  const requests: Array<{ query: string; params: string[] }> = [];
  neonConfig.fetchFunction = async (_url: string, init?: RequestInit) => {
    requests.push(JSON.parse(String(init?.body)));
    return new Response(
      JSON.stringify({
        command: 'SELECT',
        rowCount: 1,
        fields: [{ name: 'name', dataTypeID: 25 }],
        rows: [['Curious']],
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  };
  const connection = getDatabase({
    connectionString: 'postgresql://fixture:fixture@db.invalid/fixture',
  });
  try {
    const database = createPublicationDatabase(connection);
    const search = "curious' OR TRUE --";
    const result = await database
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.slug, search));
    assert.deepEqual(result, [{ name: 'Curious' }]);
    assert.equal(requests.length, 1);
    assert.match(requests[0].query, /\$1/);
    assert.ok(!requests[0].query.includes(search));
    assert.deepEqual(requests[0].params, [search]);
  } finally {
    await connection.pool.end();
    neonConfig.fetchFunction = previousFetch;
    if (previousDriver === undefined) delete process.env.NETLIFY_DB_DRIVER;
    else process.env.NETLIFY_DB_DRIVER = previousDriver;
  }
});
