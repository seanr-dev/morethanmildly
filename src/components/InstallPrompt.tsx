import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { track } from '../lib/tracking';
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export default function InstallPrompt() {
  const dialog = useRef<HTMLDialogElement>(null);
  const install = useRef<InstallEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    setInstalled(
      matchMedia('(display-mode: standalone)').matches ||
        !!(navigator as Navigator & { standalone?: boolean }).standalone,
    );
    setSupported(
      'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window,
    );
    const open = () => dialog.current?.showModal();
    const before = (e: Event) => {
      e.preventDefault();
      install.current = e as InstallEvent;
      setCanInstall(true);
    };
    const done = () => {
      setInstalled(true);
      setCanInstall(false);
      track('pwa_installed');
    };
    document.addEventListener('mtm:open-install', open);
    window.addEventListener('beforeinstallprompt', before);
    window.addEventListener('appinstalled', done);
    if ('serviceWorker' in navigator)
      void navigator.serviceWorker
        .getRegistration()
        .then((r) => r?.pushManager?.getSubscription())
        .then((s) => setSubscribed(!!s))
        .catch(() => {});
    return () => {
      document.removeEventListener('mtm:open-install', open);
      window.removeEventListener('beforeinstallprompt', before);
      window.removeEventListener('appinstalled', done);
    };
  }, []);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const abort = new AbortController();
    void fetch('/api/push', { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPublicKey(data?.publicKey || ''))
      .catch(() => {
        if (!abort.signal.aborted) setPublicKey('');
      });
    return () => abort.abort();
  }, []);
  async function doInstall() {
    if (!install.current) return;
    await install.current.prompt();
    const choice = await install.current.userChoice;
    if (choice.outcome === 'accepted')
      setMessage('Follow your browser’s instructions to finish installing.');
    install.current = null;
    setCanInstall(false);
  }
  async function notifications() {
    // Ask from the click handler before any asynchronous work: Safari requires a user gesture.
    const permissionRequest = subscribed
      ? null
      : Notification.requestPermission();
    setBusy(true);
    setMessage('');
    try {
      if (permissionRequest && (await permissionRequest) !== 'granted') {
        setMessage(
          'Notifications are off. You can allow them in your browser’s site settings.',
        );
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      if (subscribed) {
        const s = await registration.pushManager.getSubscription();
        if (s) {
          const res = await fetch('/api/push', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: s.endpoint,
              auth: s.toJSON().keys?.auth,
            }),
          });
          if (!res.ok) throw new Error((await res.json()).error);
          await s.unsubscribe();
        }
        setSubscribed(false);
        setMessage('Notifications are turned off.');
        track('notifications_disabled');
        return;
      }
      if (!publicKey)
        throw new Error(
          'Notifications are not available yet. Please check back soon.',
        );
      const key = Uint8Array.from(
        atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')),
        (c) => c.charCodeAt(0),
      );
      const previous = await registration.pushManager.getSubscription();
      const subscription =
        previous ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        }));
      const response = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subscription.toJSON(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!response.ok) {
        if (!previous) await subscription.unsubscribe();
        throw new Error((await response.json()).error);
      }
      setSubscribed(true);
      setMessage(
        'You’re subscribed. Look out for a read in the morning, afternoon, and evening.',
      );
      track('notifications_enabled');
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : 'We couldn’t update notifications. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog ref={dialog} className="modal">
      <div className="modal-heading">
        <h2>A good read, within reach.</h2>
        <button
          className="icon-button"
          aria-label="Close installation settings"
          onClick={() => dialog.current?.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      <p>Make a little space for your curiosity.</p>
      <div className="setting-panel">
        <h3>
          {installed ? 'You’re right at home.' : 'Add to your home screen'}
        </h3>
        <p>
          {installed
            ? 'More Than Mildly is installed on this device.'
            : canInstall
              ? 'Install the app for a focused reading experience.'
              : 'On iPhone or iPad, open this site in Safari, tap Share, then Add to Home Screen. On other devices, look for Install app in your browser menu.'}
        </p>
        {canInstall && (
          <button className="button" onClick={doInstall}>
            Install More Than Mildly <Icon name="diagonal" size={16} />
          </button>
        )}
      </div>
      <div className="setting-panel">
        <h3>A little inspiration, three times a day.</h3>
        <p>
          Opt in to a morning, afternoon, and evening read, around 8 am, 1 pm,
          and 7 pm in your time zone. Your device controls delivery. You can
          turn these off whenever you like.
        </p>
        {supported ? (
          <button
            className="button secondary"
            disabled={busy || (!subscribed && !publicKey)}
            onClick={notifications}
          >
            <Icon name="bell" />
            {busy
              ? 'Updating…'
              : subscribed
                ? 'Turn notifications off'
                : publicKey === null
                  ? 'Checking availability…'
                  : publicKey
                    ? 'Turn notifications on'
                    : 'Notifications unavailable'}
          </button>
        ) : (
          <p className="status-note">
            Your browser doesn’t currently support notifications here. On iPhone
            and iPad, add the app to your home screen first.
          </p>
        )}
      </div>
      <p role="status">{message}</p>
    </dialog>
  );
}
