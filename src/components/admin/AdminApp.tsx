import { useState, useEffect, useRef } from 'react';
import { logout, getUser } from '@netlify/identity';
import type {
  Article,
  Category,
  ArticlePage,
  Advertisement,
} from '../../lib/types';
import { dateLabel, slugify } from '../../lib/types';
import ArticleEditor from './ArticleEditor';
import ImageEditor from './ImageEditor';
import Icon from '../Icon';
interface Enquiry {
  id: string;
  name: string;
  email: string;
  company: string;
  kind: string;
  message: string;
  status: string;
  createdAt: string;
}
type Tab =
  'articles' | 'categories' | 'advertisements' | 'enquiries' | 'settings';
type ResourceForm = Partial<Category & Advertisement>;
export default function AdminApp({
  email,
  publicOrigin,
}: {
  email: string;
  publicOrigin: string;
}) {
  const [tab, setTab] = useState<Tab>('articles');
  const [data, setData] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Article | null | undefined>(undefined);
  const [form, setForm] = useState<ResourceForm>({});
  const [saving, setSaving] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  const controller = useRef<AbortController | null>(null);
  async function load(target = tab) {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/${target}?q=${encodeURIComponent(query)}&page=${page}`,
        { signal: abort.signal },
      );
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      setData(value);
      if (target === 'categories') setCategories(value);
    } catch (e) {
      if (!abort.signal.aborted)
        setError(
          e instanceof Error ? e.message : 'The workspace couldn’t load.',
        );
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }
  useEffect(() => {
    void getUser();
    void fetch('/api/admin/categories')
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories)
      .catch(() => {});
    return () => controller.current?.abort();
  }, []);
  useEffect(() => {
    const timer = setTimeout(
      () => {
        void load();
      },
      query ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [tab, query, page]);
  function changeTab(next: Tab) {
    if (
      editing !== undefined &&
      !confirm('Leave the editor? Any unsaved changes will be lost.')
    )
      return;
    setEditing(undefined);
    setTab(next);
    setData(null);
    setPage(1);
    setQuery('');
    setNotice('');
  }
  async function remove(id: string, label: string) {
    if (!confirm(`Delete “${label}”? This cannot be undone.`)) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/${tab}?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setNotice('Item deleted.');
      void load();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function openForm(value?: ResourceForm) {
    setError('');
    setForm(
      value ||
        (tab === 'categories'
          ? {
              name: '',
              slug: '',
              description: '',
              type: 'primary',
              position: 0,
            }
          : {
              slot: 'category-top',
              advertiser: '',
              title: '',
              targetUrl: '',
              image: null,
              active: false,
            }),
    );
    modal.current?.showModal();
  }
  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/${tab}${form.id ? `?id=${form.id}` : ''}`,
        {
          method: form.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
      );
      if (!response.ok) throw new Error((await response.json()).error);
      modal.current?.close();
      setNotice('Changes saved.');
      void load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function changeStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/enquiries?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      void load();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const labels: Record<Tab, string> = {
    articles: 'Articles',
    categories: 'Categories',
    advertisements: 'Advertising',
    enquiries: 'Enquiries',
    settings: 'Settings',
  };
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <span className="eyebrow">EDITORIAL WORKSPACE</span>
        {(Object.keys(labels) as Tab[]).map((key) => (
          <button
            key={key}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => changeTab(key)}
          >
            {labels[key]}
          </button>
        ))}
        <div className="sidebar-end">
          <span>{email}</span>
          <a href={publicOrigin} target="_blank" rel="noopener noreferrer">
            View publication ↗
          </a>
          <button
            className="text-button"
            onClick={async () => {
              if (
                editing !== undefined &&
                !confirm('Sign out and discard unsaved changes?')
              )
                return;
              await logout();
              location.href = '/admin';
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <section className="admin-main" aria-live="polite">
        {editing !== undefined ? (
          <ArticleEditor
            article={editing}
            categories={categories}
            onDone={() => {
              setEditing(undefined);
              setNotice('Article workspace updated.');
              void load('articles');
            }}
          />
        ) : (
          <>
            <header className="admin-heading">
              <div>
                <span className="eyebrow">MORE THAN MILDLY</span>
                <h1>{labels[tab]}.</h1>
                <p>
                  {tab === 'articles'
                    ? 'Thoughts worth turning into stories.'
                    : tab === 'categories'
                      ? 'Give every story a home.'
                      : tab === 'advertisements'
                        ? 'Manage the brands appearing in your publication.'
                        : tab === 'enquiries'
                          ? 'Your next conversation starts here.'
                          : 'Connections that keep your publication running.'}
                </p>
              </div>
              {tab === 'articles' ? (
                <button className="button" onClick={() => setEditing(null)}>
                  <Icon name="plus" size={17} />
                  New article
                </button>
              ) : (
                (tab === 'categories' || tab === 'advertisements') && (
                  <button className="button" onClick={() => openForm()}>
                    <Icon name="plus" size={17} />
                    {tab === 'categories' ? 'New category' : 'Add placement'}
                  </button>
                )
              )}
            </header>
            {notice && (
              <p
                className="status-note"
                role="status"
                style={{ marginBottom: 24 }}
              >
                {notice}
              </p>
            )}
            {error && (
              <div className="error-state" role="alert">
                <p>{error}</p>
                <button
                  className="button secondary small"
                  onClick={() => void load()}
                >
                  Try again
                </button>
              </div>
            )}
            {tab === 'articles' && (
              <div className="admin-toolbar">
                <label className="sr-only" htmlFor="admin-search">
                  Search all articles
                </label>
                <input
                  id="admin-search"
                  type="search"
                  value={query}
                  placeholder="Search articles, including drafts…"
                  onChange={(e) => {
                    setPage(1);
                    setQuery(e.target.value);
                  }}
                />
                <span className="muted">{data?.total ?? '—'} articles</span>
              </div>
            )}
            {busy && (
              <p role="status" style={{ padding: '20px 0' }}>
                Loading your workspace…
              </p>
            )}
            {!busy && data && tab === 'articles' && (
              <>
                {(data as ArticlePage).articles.length ? (
                  <div className="admin-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Article</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data as ArticlePage).articles.map((a) => (
                          <tr key={a.id}>
                            <td>
                              <strong>{a.title}</strong>
                              <small>/{a.slug}</small>
                            </td>
                            <td>{a.primaryCategory?.name}</td>
                            <td>
                              <span className={`status-badge ${a.status}`}>
                                {a.status}
                              </span>
                            </td>
                            <td>{dateLabel(a.publishedAt)}</td>
                            <td>
                              <div className="row-actions">
                                <button onClick={() => setEditing(a)}>
                                  Edit
                                </button>
                                <button
                                  onClick={() => void remove(a.id, a.title)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <h2>Your next story starts here.</h2>
                    <p>Create an article, or try a different search.</p>
                  </div>
                )}
                <div className="admin-pagination">
                  <button
                    className="button secondary small"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    className="button secondary small"
                    disabled={!data.nextPage}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
            {!busy && data && tab === 'categories' && (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Order</th>
                      <th>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data as Category[]).map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name}</strong>
                          <small>/{c.slug}</small>
                        </td>
                        <td>
                          <span className="status-badge">{c.type}</span>
                        </td>
                        <td>{c.description}</td>
                        <td>{c.position}</td>
                        <td>
                          <div className="row-actions">
                            <button onClick={() => openForm(c)}>Edit</button>
                            <button onClick={() => void remove(c.id, c.name)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.length && (
                  <div className="empty-state">
                    <h2>Make room for a new interest.</h2>
                    <p>
                      Create a primary category before publishing an article.
                    </p>
                  </div>
                )}
              </div>
            )}
            {!busy && data && tab === 'advertisements' && (
              <>
                {data.length ? (
                  <div className="admin-cards">
                    {(data as Advertisement[]).map((ad) => (
                      <article className="admin-info-card" key={ad.id}>
                        <span className="eyebrow">
                          {ad.slot.replace(/-/g, ' ')}
                        </span>
                        <h2 style={{ marginTop: 16 }}>{ad.advertiser}</h2>
                        <p>{ad.title}</p>
                        {ad.image && (
                          <img
                            src={ad.image.url}
                            alt={ad.image.alt}
                            style={{
                              marginTop: 20,
                              maxHeight: 160,
                              objectFit: 'contain',
                            }}
                          />
                        )}
                        <span className="status-badge">
                          {ad.active ? 'Active' : 'Inactive'}
                        </span>
                        <div className="row-actions">
                          <button onClick={() => openForm(ad)}>Edit</button>
                          <button
                            onClick={() => void remove(ad.id, ad.advertiser)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <h2>A good place to be seen.</h2>
                    <p>
                      Add a creative and destination for a category or article
                      placement. One campaign can be assigned to each of the
                      four positions.
                    </p>
                    <button className="button" onClick={() => openForm()}>
                      Add your first placement
                    </button>
                  </div>
                )}
              </>
            )}
            {!busy && data && tab === 'enquiries' && (
              <>
                {data.length ? (
                  (data as Enquiry[]).map((item) => (
                    <article className="enquiry-card" key={item.id}>
                      <header>
                        <div>
                          <span className="eyebrow">{item.kind}</span>
                          <h2>
                            {item.name}
                            {item.company ? ` · ${item.company}` : ''}
                          </h2>
                          <a href={`mailto:${item.email}`}>{item.email}</a>
                        </div>
                        <small>{dateLabel(item.createdAt)}</small>
                      </header>
                      <p>{item.message}</p>
                      <footer>
                        <label>
                          <span className="sr-only">
                            Enquiry status for {item.name}
                          </span>
                          <select
                            value={item.status}
                            onChange={(e) =>
                              void changeStatus(item.id, e.target.value)
                            }
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </label>
                        <button
                          className="text-button"
                          onClick={() =>
                            void remove(item.id, `Enquiry from ${item.name}`)
                          }
                        >
                          Delete enquiry
                        </button>
                      </footer>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    <h2>A little quiet, for now.</h2>
                    <p>
                      Advertising enquiries and privacy requests will appear
                      here.
                    </p>
                  </div>
                )}
              </>
            )}
            {!busy && data && tab === 'settings' && (
              <div className="admin-cards">
                <article className="admin-info-card">
                  <h2>Google Analytics</h2>
                  <span className="status-badge">
                    {data.analytics ? 'Configured' : 'Measurement ID needed'}
                  </span>
                  <p>
                    Set <code>PUBLIC_GA_MEASUREMENT_ID</code> in Netlify and
                    redeploy. Reading, filters, likes, shares, ad impressions,
                    ad clicks, and enquiry events respect analytics consent.
                  </p>
                </article>
                <article className="admin-info-card">
                  <h2>Advertising pixels</h2>
                  <span className="status-badge">
                    {data.marketingEnabled
                      ? 'Consent required'
                      : 'Disabled by default'}
                  </span>
                  <p>
                    Meta: {data.meta ? 'ID configured' : 'ID needed'}. TikTok:{' '}
                    {data.tiktok ? 'ID configured' : 'ID needed'}. Configure the
                    pixel IDs and review age, consent, and privacy requirements
                    before enabling <code>PUBLIC_MARKETING_ENABLED</code>.
                  </p>
                </article>
                <article className="admin-info-card">
                  <h2>Notifications</h2>
                  <span className="status-badge">
                    {data.notifications ? 'Configured' : 'Push keys needed'}
                  </span>
                  <p>
                    {data.subscribers} active subscriptions. Scheduled checks
                    select a read around 8 am, 1 pm, and 7 pm in each
                    subscriber’s time zone.
                  </p>
                </article>
                <article className="admin-info-card">
                  <h2>Admin address</h2>
                  <span className="status-badge">
                    {data.adminOrigin || 'Custom subdomain not configured'}
                  </span>
                  <p>
                    Add an admin subdomain as a domain alias on this Netlify
                    project, then set <code>PUBLIC_ADMIN_ORIGIN</code>. Give
                    approved Identity accounts the server-controlled{' '}
                    <code>admin</code> role.
                  </p>
                </article>
              </div>
            )}
          </>
        )}
      </section>
      <dialog ref={modal} className="modal">
        <div className="modal-heading">
          <h2>
            {form.id ? 'Edit' : 'Create'}{' '}
            {tab === 'categories' ? 'category' : 'placement'}.
          </h2>
          <button
            className="icon-button"
            aria-label="Close editor"
            onClick={() => modal.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <form className="modal-form" onSubmit={saveForm}>
          {tab === 'categories' ? (
            <>
              <label>
                Name
                <input
                  required
                  value={form.name || ''}
                  maxLength={60}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      ...(!form.id &&
                      (!form.slug || form.slug === slugify(form.name || ''))
                        ? { slug: slugify(e.target.value) }
                        : {}),
                    })
                  }
                />
              </label>
              <label>
                Address
                <input
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength={100}
                  value={form.slug || ''}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </label>
              <label>
                Description
                <textarea
                  required
                  minLength={5}
                  maxLength={350}
                  rows={3}
                  value={form.description || ''}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
              <div className="form-row">
                <label>
                  Type
                  <select
                    value={form.type || 'primary'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as Category['type'],
                      })
                    }
                  >
                    <option value="primary">Primary category</option>
                    <option value="secondary">Secondary category</option>
                  </select>
                </label>
                <label>
                  Display order
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={form.position || 0}
                    onChange={(e) =>
                      setForm({ ...form, position: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              <label>
                Placement
                <select
                  value={form.slot}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slot: e.target.value as Advertisement['slot'],
                    })
                  }
                >
                  {[
                    'category-top',
                    'article-top',
                    'article-middle',
                    'article-bottom',
                  ].map((slot) => (
                    <option key={slot} value={slot}>
                      {slot.replace(/-/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Advertiser
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.advertiser || ''}
                  onChange={(e) =>
                    setForm({ ...form, advertiser: e.target.value })
                  }
                />
              </label>
              <label>
                Creative headline
                <input
                  required
                  minLength={3}
                  maxLength={120}
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label>
                Destination URL
                <input
                  type="url"
                  required
                  pattern="https://.*"
                  value={form.targetUrl || ''}
                  onChange={(e) =>
                    setForm({ ...form, targetUrl: e.target.value })
                  }
                />
              </label>
              <ImageEditor
                label="Campaign image (optional)"
                optional
                value={form.image || null}
                onChange={(image) => setForm({ ...form, image })}
              />
              <label style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.active || false}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                />
                Active on the publication
              </label>
            </>
          )}
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => modal.current?.close()}
            >
              Cancel
            </button>
            <button className="button" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
