import { useState, useEffect, useRef, useCallback } from 'react';
import type { ArticlePage, Category } from '../lib/types';
import ArticleCard from './ArticleCard';
import Icon from './Icon';
import { track } from '../lib/tracking';
interface Props {
  initial: ArticlePage;
  categories: Category[];
  fixedCategory?: string;
  initialQuery?: string;
  initialSort?: string;
  initialCategory?: string;
  initialPage?: number;
  initialError?: boolean;
}
export default function ArticleExplorer({
  initial,
  categories,
  fixedCategory,
  initialQuery = '',
  initialSort = 'newest',
  initialCategory = '',
  initialPage = 1,
  initialError = false,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort);
  const [category, setCategory] = useState(initialCategory);
  const [data, setData] = useState(initial);
  const [error, setError] = useState(
    initialError
      ? 'Articles are temporarily unavailable. Please try again.'
      : '',
  );
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const next = useRef(initial.nextPage);
  const autoPages = useRef(0);
  const current = useRef({ query, sort, category });
  current.current = { query, sort, category };
  const retryRequest = useRef({ page: initialPage, append: false });
  const load = useCallback(
    async (page: number, append = false) => {
      if (append && busy.current) return;
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      busy.current = true;
      setLoading(true);
      setError('');
      retryRequest.current = { page, append };
      const filters = current.current;
      const params = new URLSearchParams({
        q: filters.query,
        sort: filters.sort,
        category: fixedCategory || filters.category,
        page: String(page),
      });
      try {
        const res = await fetch(`/api/articles?${params}`, {
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error);
        if (controller.signal.aborted) return;
        next.current = payload.nextPage;
        setData((previous) => ({
          ...payload,
          articles: append
            ? [
                ...previous.articles,
                ...payload.articles.filter(
                  (a: { id: string }) =>
                    !previous.articles.some((p) => p.id === a.id),
                ),
              ]
            : payload.articles,
        }));
        if (!append) {
          const url = new URL(location.href);
          ['q', 'sort', 'category', 'page'].forEach((k) =>
            url.searchParams.delete(k),
          );
          if (filters.query) url.searchParams.set('q', filters.query);
          if (filters.sort === 'liked') url.searchParams.set('sort', 'liked');
          if (filters.category && !fixedCategory)
            url.searchParams.set('category', filters.category);
          history.replaceState(null, '', url);
          track('article_filter', {
            sort: filters.sort,
            category: fixedCategory || filters.category,
            has_search: !!filters.query,
          });
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : 'We couldn’t load more articles. Try again.',
          );
      } finally {
        if (!controller.signal.aborted) {
          busy.current = false;
          setLoading(false);
        }
      }
    },
    [fixedCategory],
  );
  useEffect(() => {
    if (!changed) return;
    autoPages.current = 0;
    next.current = null;
    const timer = setTimeout(() => {
      void load(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, sort, category, changed, load]);
  useEffect(() => {
    if (!sentinel.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          next.current &&
          !busy.current &&
          !error &&
          autoPages.current < 3
        ) {
          autoPages.current++;
          void load(next.current, true);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [load, error, data.nextPage]);
  useEffect(() => () => abort.current?.abort(), []);
  const setFilter = (fn: () => void) => {
    setChanged(true);
    fn();
  };
  const fallbackHref = (page: number) =>
    `?${new URLSearchParams({ q: query, sort, ...(fixedCategory ? {} : { category }), page: String(page) })}#articles`;
  return (
    <section
      className="article-explorer"
      id="articles"
      aria-labelledby="articles-heading"
    >
      <div className="section-title">
        <div>
          <span className="eyebrow">THE JOURNAL</span>
          <h2 id="articles-heading">
            {fixedCategory ? 'Explore the stories' : 'A fresh perspective'}
          </h2>
        </div>
        <p className="result-count" aria-live="polite">
          {loading
            ? 'Finding your next read…'
            : `${data.total} ${data.total === 1 ? 'story' : 'stories'} to explore`}
        </p>
      </div>
      <form
        className="article-controls"
        action="#articles"
        method="get"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setChanged(true);
          void load(1);
        }}
      >
        <label className="search-field">
          <span className="sr-only">Search articles</span>
          <Icon name="search" />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(e) => setFilter(() => setQuery(e.target.value))}
            placeholder="Find something interesting…"
            maxLength={150}
          />
        </label>
        {!fixedCategory && (
          <label className="select-field">
            <span>Explore</span>
            <select
              name="category"
              value={category}
              onChange={(e) => setFilter(() => setCategory(e.target.value))}
            >
              <option value="">All categories</option>
              <optgroup label="Primary categories">
                {categories
                  .filter((c) => c.type === 'primary')
                  .map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Series">
                {categories
                  .filter((c) => c.type === 'secondary')
                  .map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </label>
        )}
        <label className="select-field">
          <span>Sort by</span>
          <select
            name="sort"
            value={sort}
            onChange={(e) => setFilter(() => setSort(e.target.value))}
          >
            <option value="newest">Newest</option>
            <option value="liked">Most liked</option>
          </select>
        </label>
        <noscript>
          <button className="button" type="submit">
            Apply
          </button>
        </noscript>
      </form>
      <div aria-busy={loading}>
        {data.articles.length > 0 && (
          <div className="article-grid">
            {data.articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
        {!data.articles.length && !loading && !error && (
          <div className="empty-state">
            <Icon name="search" size={32} />
            <h3>Nothing here just yet.</h3>
            <p>
              Try a different search, or give another category a little
              curiosity.
            </p>
            <button
              className="button secondary"
              onClick={() =>
                setFilter(() => {
                  setQuery('');
                  setCategory('');
                  setSort('newest');
                })
              }
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      {error && (
        <div className="error-state" role="alert">
          <p>{error}</p>
          <button
            className="button secondary"
            onClick={() =>
              void load(retryRequest.current.page, retryRequest.current.append)
            }
          >
            Try again
          </button>
        </div>
      )}
      <div ref={sentinel} className="load-more">
        <span className="sr-only" role="status">
          {loading ? 'Loading articles' : ''}
        </span>
        {loading && <span className="loading-line" />}
        {data.nextPage && !error && (
          <a
            className="button secondary"
            href={fallbackHref(data.nextPage)}
            onClick={(e) => {
              e.preventDefault();
              if (!loading) {
                autoPages.current = 0;
                void load(data.nextPage!, true);
              }
            }}
            aria-disabled={loading}
          >
            {loading ? 'Loading…' : 'More to discover'}
            <Icon name="down" size={16} />
          </a>
        )}
        {!data.nextPage && data.articles.length > 0 && (
          <span className="end-note">You’re all caught up. Stay curious.</span>
        )}
      </div>
      {initialPage > 1 && (
        <noscript>
          <a href={fallbackHref(initialPage - 1)}>Previous page</a>
        </noscript>
      )}
    </section>
  );
}
