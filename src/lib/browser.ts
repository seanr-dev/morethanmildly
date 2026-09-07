import { initTracking, track } from './tracking';
document.querySelectorAll('.theme-toggle').forEach((button) =>
  button.addEventListener('click', () => {
    const next =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('mtm_theme', next);
    } catch {}
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', next === 'dark' ? '#111111' : '#ffffff');
    button.setAttribute(
      'aria-label',
      `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`,
    );
  }),
);
const menuButton = document.querySelector('.mobile-menu-toggle');
const menu = document.getElementById('mobile-menu');
menuButton?.addEventListener('click', () => {
  if (!menu) return;
  const open = menu.hidden;
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu && !menu.hidden) {
    menu.hidden = true;
    menuButton?.setAttribute('aria-expanded', 'false');
    (menuButton as HTMLElement)?.focus();
  }
});
document
  .querySelectorAll('[data-open-install]')
  .forEach((button) =>
    button.addEventListener('click', () =>
      document.dispatchEvent(new Event('mtm:open-install')),
    ),
  );
document
  .querySelectorAll('[data-open-consent]')
  .forEach((button) =>
    button.addEventListener('click', () =>
      document.dispatchEvent(new Event('mtm:open-consent')),
    ),
  );
if ('serviceWorker' in navigator && !location.pathname.startsWith('/admin')) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
initTracking();
const articleId = document
  .querySelector('[data-article-id]')
  ?.getAttribute('data-article-id');
if (articleId) {
  track('article_view', { article_id: articleId });
  const seen = new Set<number>();
  const onScroll = () => {
    const total = document.documentElement.scrollHeight - innerHeight;
    const progress = total > 0 ? (scrollY / total) * 100 : 100;
    [25, 50, 75, 90].forEach((depth) => {
      if (progress >= depth && !seen.has(depth)) {
        seen.add(depth);
        track('scroll_depth', { article_id: articleId, percent: depth });
      }
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}
document
  .querySelectorAll<HTMLAnchorElement>('[data-ad-click]')
  .forEach((ad) =>
    ad.addEventListener('click', () =>
      track('ad_click', { ad_id: ad.dataset.adClick || '' }),
    ),
  );
if ('IntersectionObserver' in window) {
  const timers = new Map<Element, ReturnType<typeof setTimeout>>();
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!timers.has(entry.target))
            timers.set(
              entry.target,
              setTimeout(() => {
                track('ad_impression', {
                  ad_id: (entry.target as HTMLElement).dataset.adId || '',
                  slot: (entry.target as HTMLElement).dataset.adSlot || '',
                });
                observer.unobserve(entry.target);
                timers.delete(entry.target);
              }, 1000),
            );
        } else {
          clearTimeout(timers.get(entry.target));
          timers.delete(entry.target);
        }
      }),
    { threshold: 0.5 },
  );
  document
    .querySelectorAll('[data-ad-id]')
    .forEach((ad) => observer.observe(ad));
}
