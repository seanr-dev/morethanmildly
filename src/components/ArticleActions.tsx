import { useEffect, useState } from 'react';
import Icon from './Icon';
import { track } from '../lib/tracking';
export default function ArticleActions({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    void fetch(`/api/articles/${id}/like`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setLiked(data.liked);
      })
      .catch(() => {});
  }, [id]);
  async function toggle() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/articles/${id}/like`, {
        method: liked ? 'DELETE' : 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLiked(data.liked);
      track('article_like', { article_id: id, liked: data.liked });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setMessage('Link copied.');
      }
      track('share', { article_id: id });
    } catch (e) {
      if ((e as Error).name !== 'AbortError')
        setMessage('Copy this page’s address to share it.');
    }
  }
  return (
    <div className="article-actions">
      <div>
        <button
          className={`button ${liked ? 'liked' : 'secondary'}`}
          disabled={busy}
          onClick={toggle}
          aria-pressed={liked}
        >
          <Icon name="heart" />
          {busy ? 'Saving…' : liked ? 'Glad you liked it' : 'Worth your time?'}
        </button>
        <button className="button secondary" onClick={share}>
          <Icon name="share" />
          Share article
        </button>
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
