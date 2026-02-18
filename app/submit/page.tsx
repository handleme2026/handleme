'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SubmitPage() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);

  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const previewUrl = useMemo(() => {
    if (!file) return '';
    return URL.createObjectURL(file);
  }, [file]);

  function resetForm() {
    setTitle('');
    setFile(null);
    setAgree(false);
    setStatus('idle');
    setErrorMsg('');
  }

  async function handleSubmit() {
    setErrorMsg('');

    if (!file) {
      setStatus('error');
      setErrorMsg('Pick a photo first.');
      return;
    }

    if (!agree) {
      setStatus('error');
      setErrorMsg('Please agree to the submission terms.');
      return;
    }

    // Basic guardrails (MVP)
    const maxMB = 8;
    if (file.size > maxMB * 1024 * 1024) {
      setStatus('error');
      setErrorMsg(`Please upload an image under ${maxMB}MB.`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setStatus('error');
      setErrorMsg('That file doesn’t look like an image.');
      return;
    }

    setStatus('uploading');

    try {
      // 1) Upload to Storage
      const ext = file.name.split('.').pop() || 'jpg';
      const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';

      // Put uploads under submissions/ so our Storage policy is simple.
      const path = `submissions/${crypto.randomUUID()}.${safeExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('photos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadErr) {
        throw new Error(`Upload failed: ${uploadErr.message}`);
      }

      // 2) Insert DB row as pending
      const { error: insertErr } = await supabase.from('photos').insert({
        title: title.trim() || null,
        image_path: path,
        status: 'pending',
        like_count: 0,
      });

      if (insertErr) {
        throw new Error(`Database insert failed: ${insertErr.message}`);
      }

      setStatus('success');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message ?? 'Something went wrong.');
    }
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#070707', color: 'white', padding: 28, fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>HandleMe — Submit</h2>
        <a href="/" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>← Home</a>
      </header>

      <p style={{ color: '#bdbdbd', maxWidth: 720, lineHeight: 1.5 }}>
        Submit a hand photo for review. Keep it classy, consensual, and true to the vibe.
        Once approved, it’ll appear in the gallery. ✋
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, maxWidth: 720 }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ opacity: 0.85 }}>Title (optional)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Rings & Light"
            style={{
              padding: 10,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#0f0f0f',
              color: 'white',
              outline: 'none',
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ opacity: 0.85 }}>Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ color: '#bdbdbd' }}
          />
        </label>

        {file ? (
          <div style={{ background: '#0f0f0f', borderRadius: 12, padding: 12, border: '1px solid rgba(255,255,255,0.10)' }}>
            <div style={{ fontSize: 13, color: '#bdbdbd', marginBottom: 10 }}>
              Preview (not public until approved)
            </div>
            <img
              src={previewUrl}
              alt="preview"
              style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 10, display: 'block' }}
            />
          </div>
        ) : null}

        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#bdbdbd' }}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          <span style={{ lineHeight: 1.4 }}>
            I confirm I own this photo or have permission to share it, it depicts consenting adults only,
            and it follows HandleMe’s submission terms (no nudity, no explicit acts, no minors, no harassment).
          </span>
        </label>

        {status === 'error' ? (
          <div style={{ color: '#ff6b6b' }}>{errorMsg}</div>
        ) : null}

        {status === 'success' ? (
          <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', padding: 12, borderRadius: 12 }}>
            <div style={{ fontWeight: 700, color: '#ff4d6d' }}>Submitted ✨</div>
            <div style={{ color: '#bdbdbd', marginTop: 6 }}>
              Your photo is in the review queue. Once approved, it will appear in the gallery.
            </div>
            <button
              onClick={resetForm}
              style={{
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: '#0f0f0f',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Submit another
            </button>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={status === 'uploading'}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.18)',
              background: status === 'uploading' ? '#111' : '#ff4d6d',
              color: 'white',
              cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
              fontWeight: 800,
            }}
          >
            {status === 'uploading' ? 'Submitting…' : 'Submit for review'}
          </button>
        )}

        <div style={{ fontSize: 12, color: '#7f7f7f' }}>
          Tip: You can later require accounts to submit, add automatic tagging, and add a “Report” button in the gallery.
        </div>
      </div>
    </main>
  );
}
