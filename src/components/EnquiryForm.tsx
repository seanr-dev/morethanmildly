import { useState } from 'react';
import Icon from './Icon';
import { track } from '../lib/tracking';
export default function EnquiryForm({
  kind = 'advertising',
}: {
  kind?: 'advertising' | 'privacy' | 'editorial';
}) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, kind }),
      });
      const value = await res.json();
      if (!res.ok) throw new Error(value.error);
      setSent(true);
      track(
        kind === 'advertising' ? 'advertising_enquiry' : 'contact_enquiry',
        { enquiry_type: kind },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <div className="form-success" role="status">
        <Icon name="check" size={30} />
        <h3>Thanks for reaching out.</h3>
        <p>
          Your message has been received. The More Than Mildly team can now
          review it and reply to the email you provided.
        </p>
        <button className="button secondary" onClick={() => setSent(false)}>
          Send another message
        </button>
      </div>
    );
  return (
    <form className="enquiry-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          Your name
          <input
            name="name"
            required
            autoComplete="name"
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
      </div>
      {kind === 'advertising' && (
        <label>
          Company or brand <span className="optional">(optional)</span>
          <input name="company" autoComplete="organization" maxLength={150} />
        </label>
      )}
      <label>
        {kind === 'advertising'
          ? 'Tell us a little about your campaign'
          : kind === 'privacy'
            ? 'How can we help with your privacy request?'
            : 'Your message'}
        <textarea
          name="message"
          rows={5}
          minLength={15}
          maxLength={5000}
          required
          placeholder={
            kind === 'advertising'
              ? 'Your goals, preferred categories, timing, and any questions…'
              : 'Please describe your request. Avoid including sensitive personal information.'
          }
        />
      </label>
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave this field empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="form-privacy">
        We’ll use these details to respond to your enquiry.{' '}
        <a href="/privacy">Privacy policy</a>
      </p>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy
          ? 'Sending…'
          : kind === 'advertising'
            ? 'Let’s start a conversation'
            : 'Send your request'}
        <Icon name="arrow" size={18} />
      </button>
      <noscript>
        <p>JavaScript is needed to submit this form.</p>
      </noscript>
    </form>
  );
}
