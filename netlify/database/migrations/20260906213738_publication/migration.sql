CREATE TYPE "article_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "category_type" AS ENUM('primary', 'secondary');--> statement-breakpoint
CREATE TABLE "advertisements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slot" text NOT NULL UNIQUE,
	"advertiser" text NOT NULL,
	"title" text NOT NULL,
	"image" jsonb,
	"target_url" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_likes" (
	"article_id" uuid,
	"visitor_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "article_likes_pkey" PRIMARY KEY("article_id","visitor_hash")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"excerpt" text NOT NULL,
	"body" jsonb NOT NULL,
	"header_image" jsonb NOT NULL,
	"inline_images" jsonb DEFAULT '[]' NOT NULL,
	"primary_category_id" uuid NOT NULL,
	"secondary_category_id" uuid,
	"status" "article_status" DEFAULT 'draft'::"article_status" NOT NULL,
	"author" text DEFAULT 'More Than Mildly' NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text DEFAULT '' NOT NULL,
	"type" "category_type" NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'advertising' NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"subscription_id" uuid NOT NULL,
	"local_date" text NOT NULL,
	"period" text NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"article_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"endpoint" text NOT NULL UNIQUE,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"visitor_hash" text NOT NULL,
	"time_zone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY,
	"count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "articles_published_idx" ON "articles" ("status","published_at");--> statement-breakpoint
CREATE INDEX "articles_popular_idx" ON "articles" ("status","likes");--> statement-breakpoint
CREATE INDEX "articles_primary_idx" ON "articles" ("primary_category_id");--> statement-breakpoint
CREATE INDEX "articles_secondary_idx" ON "articles" ("secondary_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_delivery_unique" ON "notification_deliveries" ("subscription_id","local_date","period");--> statement-breakpoint
ALTER TABLE "article_likes" ADD CONSTRAINT "article_likes_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_primary_category_id_categories_id_fkey" FOREIGN KEY ("primary_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_secondary_category_id_categories_id_fkey" FOREIGN KEY ("secondary_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_j4RNi9XIUNcK_fkey" FOREIGN KEY ("subscription_id") REFERENCES "push_subscriptions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE SET NULL;