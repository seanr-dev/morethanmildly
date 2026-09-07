import type { Article } from '../lib/types';
import { readMinutes, dateLabel } from '../lib/types';
import Icon from './Icon';
export default function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="article-card">
      <a
        className="card-image-link"
        href={`/articles/${article.slug}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          className="editorial-image"
          src={article.headerImage.url}
          alt=""
          loading="lazy"
          decoding="async"
          width="800"
          height="530"
        />
      </a>
      <div className="card-meta">
        <a href={`/category/${article.primaryCategory?.slug}`}>
          {article.primaryCategory?.name}
        </a>
        <span>{readMinutes(article.body)} min read</span>
      </div>
      <h3>
        <a href={`/articles/${article.slug}`}>{article.title}</a>
      </h3>
      <p>{article.excerpt}</p>
      <div className="card-bottom">
        <time dateTime={article.publishedAt || undefined}>
          {dateLabel(article.publishedAt)}
        </time>
        <a
          href={`/articles/${article.slug}`}
          aria-label={`Read ${article.title}`}
        >
          <Icon name="diagonal" size={20} />
        </a>
      </div>
    </article>
  );
}
