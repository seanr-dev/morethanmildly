import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type {
  ArticleImage,
  InlineImage,
  ContentBlock,
  AdSlot,
} from '../lib/types';

export const categoryType = pgEnum('category_type', ['primary', 'secondary']);
export const articleStatus = pgEnum('article_status', ['draft', 'published']);
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  type: categoryType('type').notNull(),
  position: integer('position').notNull().default(0),
});
export const articles = pgTable(
  'articles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    excerpt: text('excerpt').notNull(),
    body: jsonb('body').$type<ContentBlock[]>().notNull(),
    headerImage: jsonb('header_image').$type<ArticleImage>().notNull(),
    inlineImages: jsonb('inline_images')
      .$type<InlineImage[]>()
      .notNull()
      .default([]),
    primaryCategoryId: uuid('primary_category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    secondaryCategoryId: uuid('secondary_category_id').references(
      () => categories.id,
      { onDelete: 'restrict' },
    ),
    status: articleStatus('status').notNull().default('draft'),
    author: text('author').notNull().default('More Than Mildly'),
    likes: integer('likes').notNull().default(0),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('articles_published_idx').on(t.status, t.publishedAt),
    index('articles_popular_idx').on(t.status, t.likes),
    index('articles_primary_idx').on(t.primaryCategoryId),
    index('articles_secondary_idx').on(t.secondaryCategoryId),
  ],
);
export const articleLikes = pgTable(
  'article_likes',
  {
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    visitorHash: text('visitor_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.visitorHash] })],
);
export const advertisements = pgTable('advertisements', {
  id: uuid('id').defaultRandom().primaryKey(),
  slot: text('slot').$type<AdSlot>().notNull().unique(),
  advertiser: text('advertiser').notNull(),
  title: text('title').notNull(),
  image: jsonb('image').$type<ArticleImage>(),
  targetUrl: text('target_url').notNull(),
  active: boolean('active').notNull().default(false),
});
export const enquiries = pgTable('enquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company').notNull().default(''),
  kind: text('kind').notNull().default('advertising'),
  message: text('message').notNull(),
  status: text('status').notNull().default('new'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  visitorHash: text('visitor_hash').notNull(),
  timeZone: text('time_zone').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const notificationDeliveries = pgTable(
  'notification_deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => pushSubscriptions.id, { onDelete: 'cascade' }),
    localDate: text('local_date').notNull(),
    period: text('period').notNull(),
    state: text('state').notNull().default('pending'),
    articleId: uuid('article_id').references(() => articles.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('notification_delivery_unique').on(
      t.subscriptionId,
      t.localDate,
      t.period,
    ),
  ],
);
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(1),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
