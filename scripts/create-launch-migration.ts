import { mkdir, writeFile } from 'node:fs/promises';
import { launchCategories, launchArticles } from '../src/data/launch-content';
const quote = (value: unknown): string =>
  value === null
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : `'${String(typeof value === 'object' ? JSON.stringify(value) : value).replaceAll("'", "''")}'`;
const directory = 'netlify/database/migrations/20260906220000_launch-content';
await mkdir(directory, { recursive: true });
const categorySql = launchCategories
  .map(
    (c) =>
      `INSERT INTO categories (id, name, slug, description, type, position) VALUES (${[c.id, c.name, c.slug, c.description, c.type, c.position].map(quote).join(', ')}) ON CONFLICT DO NOTHING;`,
  )
  .join('\n');
const articleSql = launchArticles
  .map(
    (a) =>
      `INSERT INTO articles (id, title, slug, excerpt, body, header_image, inline_images, primary_category_id, secondary_category_id, author, status, published_at, created_at, updated_at) VALUES (${[a.id, a.title, a.slug, a.excerpt, a.body, a.headerImage, a.inlineImages, a.primaryCategoryId, a.secondaryCategoryId, a.author, a.status, a.publishedAt, a.publishedAt, a.publishedAt].map(quote).join(', ')}) ON CONFLICT DO NOTHING;`,
  )
  .join('\n');
await writeFile(
  `${directory}/migration.sql`,
  `-- Original launch essays. Run once; never overwrites existing editorial work.\n${categorySql}\n\n${articleSql}\n`,
);
console.log(
  `Prepared ${launchCategories.length} categories and ${launchArticles.length} original articles.`,
);
