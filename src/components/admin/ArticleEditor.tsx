import { useState, useEffect } from 'react';
import type { Article, Category, ContentBlock } from '../../lib/types';
import { slugify } from '../../lib/types';
import Icon from '../Icon';
import ImageEditor from './ImageEditor';
type Draft = Pick<
  Article,
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'body'
  | 'headerImage'
  | 'inlineImages'
  | 'primaryCategoryId'
  | 'secondaryCategoryId'
  | 'status'
  | 'author'
>;
export default function ArticleEditor({
  article,
  categories,
  onDone,
}: {
  article: Article | null;
  categories: Category[];
  onDone: () => void;
}) {
  const [form, setForm] = useState<Draft>(
    article || {
      title: '',
      slug: '',
      excerpt: '',
      body: [{ type: 'paragraph', text: '' }],
      headerImage: { url: '', alt: '' },
      inlineImages: [],
      primaryCategoryId: '',
      secondaryCategoryId: null,
      status: 'draft',
      author: 'More Than Mildly',
    },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const update = (patch: Partial<Draft>) => {
    setDirty(true);
    setForm((previous) => ({ ...previous, ...patch }));
  };
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [dirty]);
  function exit() {
    if (!dirty || confirm('Discard your unsaved article changes?')) onDone();
  }
  function block(index: number, patch: Partial<ContentBlock>) {
    update({
      body: form.body.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    });
  }
  function move(index: number, by: number) {
    const to = index + by;
    if (to < 0 || to >= form.body.length) return;
    const body = [...form.body];
    [body[index], body[to]] = [body[to], body[index]];
    update({
      body,
      inlineImages: form.inlineImages.map((i) => ({
        ...i,
        afterBlock:
          i.afterBlock === index
            ? to
            : i.afterBlock === to
              ? index
              : i.afterBlock,
      })),
    });
  }
  function remove(index: number) {
    if (form.body.length === 1) return;
    update({
      body: form.body.filter((_, i) => i !== index),
      inlineImages: form.inlineImages.map((i) => ({
        ...i,
        afterBlock:
          i.afterBlock >= index ? Math.max(0, i.afterBlock - 1) : i.afterBlock,
      })),
    });
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/articles${article ? `?id=${article.id}` : ''}`,
        {
          method: article ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDirty(false);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Article could not be saved.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-editor" onSubmit={save}>
      <div className="editor-header">
        <div>
          <button type="button" className="text-button" onClick={exit}>
            ← All articles
          </button>
          <h1 style={{ marginTop: 14 }}>
            {article ? 'Edit your story.' : 'Something worth sharing.'}
          </h1>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => setPreview(!preview)}
          >
            {preview ? 'Back to editor' : 'Preview article'}
          </button>
          <button className="button" disabled={busy}>
            {busy
              ? 'Saving…'
              : form.status === 'published'
                ? 'Save & publish'
                : 'Save draft'}
          </button>
        </div>
      </div>
      {error && (
        <p className="error-text" role="alert" style={{ marginBottom: 24 }}>
          {error}
        </p>
      )}
      {preview ? (
        <div className="editor-preview">
          <span className="eyebrow">UNSAVED PREVIEW</span>
          <h2>{form.title || 'Your article title'}</h2>
          <p style={{ marginBottom: 24 }}>{form.excerpt}</p>
          {form.headerImage.url && (
            <img src={form.headerImage.url} alt={form.headerImage.alt} />
          )}
          <div className="preview-block">
            {form.body.map((b, i) => (
              <div key={i}>
                {b.type === 'paragraph' ? (
                  <p>{b.text}</p>
                ) : b.type === 'heading' ? (
                  <h3>{b.text}</h3>
                ) : b.type === 'quote' ? (
                  <blockquote>
                    <p>{b.text}</p>
                  </blockquote>
                ) : (
                  <ul>
                    {b.text.split('\n').map((line, n) => (
                      <li key={n}>{line}</li>
                    ))}
                  </ul>
                )}
                {form.inlineImages
                  .filter((img) => img.afterBlock === i)
                  .map((img, n) => (
                    <img key={n} src={img.url} alt={img.alt} />
                  ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="editor-layout">
          <div className="editor-main">
            <label>
              Article title
              <input
                className="title-input"
                value={form.title}
                required
                minLength={5}
                maxLength={180}
                onChange={(e) =>
                  update({
                    title: e.target.value,
                    ...(!article &&
                    (!form.slug || form.slug === slugify(form.title))
                      ? { slug: slugify(e.target.value) }
                      : {}),
                  })
                }
              />
            </label>
            <label>
              Short introduction
              <textarea
                value={form.excerpt}
                rows={3}
                minLength={20}
                maxLength={400}
                required
                onChange={(e) => update({ excerpt: e.target.value })}
              />
            </label>
            <section className="block-editor">
              <div className="block-heading">
                <h2>The story</h2>
                <span className="muted" style={{ fontSize: '.8125rem' }}>
                  {form.body.length} blocks
                </span>
              </div>
              {form.body.map((b, i) => (
                <div key={i} className={`content-block type-${b.type}`}>
                  <div className="content-block-tools">
                    <label className="sr-only" htmlFor={`type-${i}`}>
                      Block {i + 1} type
                    </label>
                    <select
                      id={`type-${i}`}
                      value={b.type}
                      onChange={(e) =>
                        block(i, {
                          type: e.target.value as ContentBlock['type'],
                        })
                      }
                    >
                      <option value="paragraph">Paragraph</option>
                      <option value="heading">Heading</option>
                      <option value="quote">Pull quote</option>
                      <option value="list">List (one item per line)</option>
                    </select>
                    <button
                      type="button"
                      aria-label={`Move block ${i + 1} up`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move block ${i + 1} down`}
                      disabled={i === form.body.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove block ${i + 1}`}
                      disabled={form.body.length === 1}
                      onClick={() => remove(i)}
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                  <label className="sr-only" htmlFor={`block-${i}`}>
                    Block {i + 1} content
                  </label>
                  <textarea
                    id={`block-${i}`}
                    value={b.text}
                    required
                    maxLength={15000}
                    rows={b.type === 'heading' ? 2 : 4}
                    placeholder={
                      b.type === 'heading'
                        ? 'A new thought…'
                        : 'Let your curiosity do the talking…'
                    }
                    onChange={(e) => block(i, { text: e.target.value })}
                  />
                </div>
              ))}
              <button
                className="button secondary block-add"
                type="button"
                disabled={form.body.length >= 150}
                onClick={() =>
                  update({
                    body: [...form.body, { type: 'paragraph', text: '' }],
                  })
                }
              >
                <Icon name="plus" size={18} />
                Add content block
              </button>
            </section>
          </div>
          <aside className="editor-side">
            <h2>Publishing details</h2>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  update({ status: e.target.value as Draft['status'] })
                }
              >
                <option value="draft">Draft — only visible to admins</option>
                <option value="published">
                  Published — visible to everyone
                </option>
              </select>
            </label>
            <label>
              Primary category (required)
              <select
                value={form.primaryCategoryId}
                required
                onChange={(e) => update({ primaryCategoryId: e.target.value })}
              >
                <option value="">Choose a primary category</option>
                {categories
                  .filter((c) => c.type === 'primary')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Secondary category (optional)
              <select
                value={form.secondaryCategoryId || ''}
                onChange={(e) =>
                  update({ secondaryCategoryId: e.target.value || null })
                }
              >
                <option value="">No secondary category</option>
                {categories
                  .filter((c) => c.type === 'secondary')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Article address
              <input
                value={form.slug}
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={100}
                onChange={(e) => update({ slug: e.target.value })}
              />
            </label>
            {article?.status === 'published' && (
              <p className="form-privacy">
                Changing the address changes the public link. Existing links to
                the old address will stop working.
              </p>
            )}
            <label>
              Author name
              <input
                value={form.author}
                required
                minLength={2}
                maxLength={100}
                onChange={(e) => update({ author: e.target.value })}
              />
            </label>
            <ImageEditor
              label="Header image (required)"
              value={form.headerImage}
              onChange={(image) =>
                update({ headerImage: image || { url: '', alt: '' } })
              }
            />
            <h2>Inside the article</h2>
            {[0, 1, 2].map((index) => (
              <div key={index}>
                <ImageEditor
                  label={`Inline image ${index + 1} (optional)`}
                  optional
                  value={form.inlineImages[index] || null}
                  onChange={(image) => {
                    const images = [...form.inlineImages];
                    if (image)
                      images[index] = {
                        ...image,
                        afterBlock: images[index]?.afterBlock || 0,
                      };
                    else images.splice(index, 1);
                    update({ inlineImages: images.filter(Boolean) });
                  }}
                />
                {form.inlineImages[index] && (
                  <label style={{ marginTop: 12 }}>
                    Place after content block
                    <select
                      value={form.inlineImages[index].afterBlock}
                      onChange={(e) => {
                        const images = [...form.inlineImages];
                        images[index] = {
                          ...images[index],
                          afterBlock: Number(e.target.value),
                        };
                        update({ inlineImages: images });
                      }}
                    >
                      {form.body.map((b, i) => (
                        <option value={i} key={i}>
                          {i + 1}. {b.text.slice(0, 35) || 'Empty block'}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            ))}
          </aside>
        </div>
      )}
    </form>
  );
}
