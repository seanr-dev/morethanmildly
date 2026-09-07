export interface ConsentState {
  version: 1;
  analytics: boolean;
  marketing: boolean;
  updatedAt: number;
}
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & {
      queue?: unknown[];
      callMethod?: (...args: unknown[]) => void;
      push?: unknown;
      loaded?: boolean;
      version?: string;
    };
    ttq?: any;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}
export const marketingAvailable =
  import.meta.env.PUBLIC_MARKETING_ENABLED === 'true';
export function consent(): ConsentState | null {
  try {
    const value = JSON.parse(localStorage.getItem('mtm_consent') || 'null');
    return value?.version === 1 &&
      typeof value.analytics === 'boolean' &&
      typeof value.marketing === 'boolean' &&
      Date.now() - value.updatedAt < 400 * 86400_000
      ? {
          ...value,
          marketing:
            value.marketing &&
            !navigator.globalPrivacyControl &&
            marketingAvailable,
        }
      : null;
  } catch {
    return null;
  }
}
export function saveConsent(
  next: Pick<ConsentState, 'analytics' | 'marketing'>,
) {
  const value: ConsentState = {
    ...next,
    version: 1,
    marketing:
      next.marketing && marketingAvailable && !navigator.globalPrivacyControl,
    updatedAt: Date.now(),
  };
  localStorage.setItem('mtm_consent', JSON.stringify(value));
  const ga = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;
  if (ga) window[`ga-disable-${ga}`] = !value.analytics;
  if (!value.marketing) window.fbq?.('consent', 'revoke');
  if (!value.analytics || !value.marketing) {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (
        (!value.analytics && /^(_ga|_gid|_gat)/.test(name)) ||
        (!value.marketing && /^(_fbp|_fbc|_ttp|tt_)/.test(name))
      ) {
        const domains = ['', location.hostname, `.${location.hostname}`];
        for (let parts = location.hostname.split('.'); parts.length > 2;) {
          parts.shift();
          domains.push(`.${parts.join('.')}`);
        }
        domains.forEach((domain) => {
          document.cookie = `${name}=; Max-Age=0; Path=/; ${domain ? `Domain=${domain};` : ''} SameSite=Lax`;
        });
      }
    }
  }
  window.dispatchEvent(new CustomEvent('mtm:consent', { detail: value }));
  return value;
}
function script(src: string, id: string) {
  if (document.getElementById(id)) return;
  const el = document.createElement('script');
  el.id = id;
  el.async = true;
  el.src = src;
  document.head.append(el);
}
export function initTracking() {
  const current = consent();
  if (!current) return;
  const ga = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;
  if (
    current.analytics &&
    /^G-[A-Z0-9]+$/.test(ga || '') &&
    !document.getElementById('mtm-ga')
  ) {
    window.dataLayer ||= [];
    window.gtag = function () {
      window.dataLayer!.push(arguments);
    };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: current.marketing ? 'granted' : 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    window.gtag('config', ga, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname,
    });
    script(`https://www.googletagmanager.com/gtag/js?id=${ga}`, 'mtm-ga');
  }
  const meta = import.meta.env.PUBLIC_META_PIXEL_ID;
  if (current.marketing && /^\d+$/.test(meta || '') && !window.fbq) {
    const fb: NonNullable<Window['fbq']> = function (...args) {
      if (fb.callMethod) fb.callMethod(...args);
      else fb.queue!.push(args);
    };
    fb.queue = [];
    fb.push = fb;
    fb.loaded = true;
    fb.version = '2.0';
    window.fbq = fb;
    script('https://connect.facebook.net/en_US/fbevents.js', 'mtm-meta');
    fb('consent', 'grant');
    fb('init', meta);
    fb('track', 'PageView');
  }
  const tik = import.meta.env.PUBLIC_TIKTOK_PIXEL_ID;
  if (
    current.marketing &&
    /^[A-Z0-9]{10,40}$/i.test(tik || '') &&
    !window.ttq
  ) {
    const q: any = [];
    q.methods = [
      'page',
      'track',
      'identify',
      'instances',
      'debug',
      'on',
      'off',
      'once',
      'ready',
      'alias',
      'group',
      'enableCookie',
      'disableCookie',
      'holdConsent',
      'revokeConsent',
      'grantConsent',
    ];
    q.setAndDefer = (t: any, method: string) => {
      t[method] = (...args: unknown[]) => t.push([method, ...args]);
    };
    q.methods.forEach((m: string) => q.setAndDefer(q, m));
    q._i = { [tik]: [] };
    q._i[tik]._u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    q._t = { [tik]: Date.now() };
    q._o = { [tik]: {} };
    window.ttq = q;
    (window as any).TiktokAnalyticsObject = 'ttq';
    script(
      `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${tik}&lib=ttq`,
      'mtm-tiktok',
    );
    q.grantConsent();
    q.page();
  }
}
export function track(
  event: string,
  parameters: Record<string, string | number | boolean> = {},
) {
  if (typeof window === 'undefined') return;
  const current = consent();
  if (current?.analytics) window.gtag?.('event', event, parameters);
  if (current?.marketing && event === 'advertising_enquiry') {
    window.fbq?.('track', 'Lead');
    window.ttq?.track('SubmitForm');
  }
}
