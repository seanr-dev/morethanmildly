import { useId, useState } from 'react';
import type { ArticleImage } from '../../lib/types';
export default function ImageEditor({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  value: ArticleImage | null;
  onChange: (image: ArticleImage | null) => void;
  optional?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputId = useId();
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      if (file.size > 5_000_000)
        throw new Error('Please choose an image smaller than 5 MB.');
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onChange({
        url: data.url,
        alt: value?.alt || '',
        credit: value?.credit || '',
        source: value?.source || '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image upload failed.');
    } finally {
      setBusy(false);
    }
  }
  const update = (patch: Partial<ArticleImage>) =>
    onChange({ url: '', alt: '', ...value, ...patch });
  return (
    <fieldset className="image-editor">
      <legend>{label}</legend>
      {value?.url && <img src={value.url} alt={value.alt || 'Image preview'} />}
      <label htmlFor={inputId}>
        Upload JPG, PNG, or WebP
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </label>
      {busy && <p role="status">Uploading image…</p>}
      <label>
        Or image URL
        <input
          type="text"
          value={value?.url || ''}
          onChange={(e) => update({ url: e.target.value })}
          placeholder="https://…"
          maxLength={2000}
        />
      </label>
      {(value?.url || !optional) && (
        <>
          <label>
            Image description (alt text)
            <input
              value={value?.alt || ''}
              required={!optional || !!value?.url}
              minLength={3}
              maxLength={300}
              onChange={(e) => update({ alt: e.target.value })}
            />
          </label>
          <label>
            Photographer or credit (optional)
            <input
              value={value?.credit || ''}
              maxLength={200}
              onChange={(e) => update({ credit: e.target.value })}
            />
          </label>
          <label>
            Source link (optional)
            <input
              type="url"
              value={value?.source || ''}
              maxLength={2000}
              onChange={(e) => update({ source: e.target.value })}
            />
          </label>
        </>
      )}
      {optional && value && (
        <button
          type="button"
          className="remove-image"
          onClick={() => onChange(null)}
        >
          Remove image
        </button>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
