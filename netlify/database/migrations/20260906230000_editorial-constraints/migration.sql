-- Keep category roles and content constraints true for every database writer.
ALTER TABLE articles ADD CONSTRAINT articles_nonnegative_likes CHECK (likes >= 0);
ALTER TABLE articles ADD CONSTRAINT articles_body_array CHECK (jsonb_typeof(body) = 'array' AND jsonb_array_length(body) > 0);
ALTER TABLE articles ADD CONSTRAINT articles_inline_limit CHECK (jsonb_typeof(inline_images) = 'array' AND jsonb_array_length(inline_images) <= 3);
ALTER TABLE articles ADD CONSTRAINT articles_published_date CHECK (status <> 'published' OR published_at IS NOT NULL);
ALTER TABLE advertisements ADD CONSTRAINT advertisements_valid_slot CHECK (slot IN ('category-top', 'article-top', 'article-middle', 'article-bottom'));
ALTER TABLE enquiries ADD CONSTRAINT enquiries_valid_kind CHECK (kind IN ('advertising', 'privacy', 'editorial'));
ALTER TABLE enquiries ADD CONSTRAINT enquiries_valid_status CHECK (status IN ('new', 'contacted', 'closed'));

CREATE FUNCTION mtm_check_article_categories() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE id = NEW.primary_category_id AND type = 'primary') THEN
    RAISE EXCEPTION 'An article requires a primary category' USING ERRCODE = '23514';
  END IF;
  IF NEW.secondary_category_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM categories WHERE id = NEW.secondary_category_id AND type = 'secondary') THEN
    RAISE EXCEPTION 'The optional category must be secondary' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER articles_category_types BEFORE INSERT OR UPDATE OF primary_category_id, secondary_category_id ON articles FOR EACH ROW EXECUTE FUNCTION mtm_check_article_categories();

CREATE FUNCTION mtm_check_category_type_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.type <> NEW.type AND EXISTS (SELECT 1 FROM articles WHERE primary_category_id = NEW.id OR secondary_category_id = NEW.id) THEN
    RAISE EXCEPTION 'Reassign articles before changing category type' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER categories_type_change BEFORE UPDATE OF type ON categories FOR EACH ROW EXECUTE FUNCTION mtm_check_category_type_change();
