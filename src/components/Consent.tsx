import { useEffect, useRef, useState } from 'react';
import {
  consent,
  saveConsent,
  initTracking,
  marketingAvailable,
} from '../lib/tracking';
import Icon from './Icon';
export default function Consent() {
  const [show, setShow] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [gpc, setGpc] = useState(false);
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const saved = consent();
    setShow(!saved);
    setAnalytics(saved?.analytics || false);
    setMarketing(saved?.marketing || false);
    setGpc(!!navigator.globalPrivacyControl);
    initTracking();
    if (new URL(location.href).searchParams.get('optout') === '1') {
      saveConsent({ analytics: saved?.analytics || false, marketing: false });
      setShow(false);
      setNotice('Your choice is saved. Optional advertising tracking is off.');
    }
    const open = () => {
      const saved = consent();
      setAnalytics(saved?.analytics || false);
      setMarketing(saved?.marketing || false);
      dialog.current?.showModal();
    };
    document.addEventListener('mtm:open-consent', open);
    return () => document.removeEventListener('mtm:open-consent', open);
  }, []);
  function save(a: boolean, m: boolean) {
    try {
      const previous = consent();
      saveConsent({ analytics: a, marketing: m });
      setShow(false);
      dialog.current?.close();
      if (
        previous &&
        ((!a && previous.analytics) || (!m && previous.marketing))
      )
        location.reload();
      else {
        initTracking();
        setNotice('Your cookie preferences have been saved.');
      }
    } catch {
      setNotice(
        'Your browser blocked saving preferences. Optional tracking remains off.',
      );
    }
  }
  return (
    <>
      {show && (
        <section className="cookie-banner" aria-label="Cookie choices">
          <div>
            <strong>A little choice goes a long way.</strong>
            <p>
              Essential storage keeps this site working. With your permission,
              optional cookies help us understand what you enjoy.{' '}
              <a href="/cookies">Read our cookie policy.</a>
            </p>
          </div>
          <div className="cookie-actions">
            <button
              className="button secondary"
              onClick={() => save(false, false)}
            >
              Reject optional
            </button>
            <button
              className="button secondary"
              onClick={() => save(true, false)}
            >
              Accept analytics
            </button>
            <button
              className="text-button"
              onClick={() => dialog.current?.showModal()}
            >
              Choose settings
            </button>
          </div>
        </section>
      )}
      <dialog ref={dialog} className="modal consent-modal">
        <div className="modal-heading">
          <h2>Your privacy, your choice.</h2>
          <button
            className="icon-button"
            aria-label="Close cookie settings"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <p>
          You can change these preferences at any time using the link in our
          footer.
        </p>
        <div className="consent-option">
          <div>
            <strong>Essential</strong>
            <p>
              Security, preferences, and features you request, such as article
              likes.
            </p>
          </div>
          <span>Always on</span>
        </div>
        <label className="consent-option">
          <div>
            <strong>Analytics</strong>
            <p>Allow Google Analytics to measure reading and site activity.</p>
          </div>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => setAnalytics(e.target.checked)}
          />
        </label>
        <label className="consent-option">
          <div>
            <strong>Advertising measurement</strong>
            <p>
              {marketingAvailable
                ? 'Allow Meta and TikTok to measure campaigns. Optional and off by default.'
                : 'Meta and TikTok tracking is currently disabled on this publication.'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={marketing}
            disabled={!marketingAvailable || gpc}
            onChange={(e) => setMarketing(e.target.checked)}
          />
        </label>
        {gpc && (
          <p className="status-note">
            Your browser’s Global Privacy Control is respected. Advertising
            tracking stays off.
          </p>
        )}
        <div className="form-actions">
          <button
            className="button secondary"
            onClick={() => save(false, false)}
          >
            Reject optional
          </button>
          <button className="button" onClick={() => save(analytics, marketing)}>
            Save preferences
          </button>
        </div>
      </dialog>
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button
            className="icon-button"
            onClick={() => setNotice('')}
            aria-label="Dismiss notice"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </>
  );
}
