'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type TagRow = { id: string; name: string };

const DEFAULT_TAGS = ['working', 'rings', 'veiny', 'manicured', 'minimal', 'tattooed'];

export default function SubmitPage() {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);

  const [tags, setTags] = useState<TagRow[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const previewUrl = useMemo(() => {
    if (!file) return '';
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('tags').select('id,name').order('name');
      if (error || !data || data.length === 0) {
        setTags(DEFAULT_TAGS.map((name, i) => ({ id: `local_${i}`, name })));
        return;
      }
      setTags(data as TagRow[]);
    })();
  }, []);

  function resetForm() {
    setTitle('');
    setLocation('');
    setFile(null);
    setAgree(false);
    setSelectedTags([]);
    setStatus('idle');
    setErrorMsg('');
  }

  function isCityState(s: string) {
    return /^[^,]+,\s*[A-Za-z]{2,}$/.test(s.trim());
  }

  function toggleTag(name: string) {
    setSelectedTags((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  }

  function fail(msg: string) {
    setStatus('error');
    setErrorMsg(msg);
  }

  async function handleSubmit() {
    setErrorMsg('');

    const cleanTitle = title.trim();
    const cleanLocation = location.trim();

    if (!cleanTitle) return fail('Photo name is required.');
    if (!cleanLocation) return fail('Location is required (City, State).');
    if (!isCityState(cleanLocation)) return fail('Please use the format: City, ST (example: Austin, TX).');
    if (!file) return fail('Pick a photo first.');
    if (!agree) return fail('Please agree to the submission terms.');

    const maxMB = 8;
    if (file.size > maxMB * 1024 * 1024) return fail(`Please upload an image under ${maxMB}MB.`);
    if (!file.type.startsWith('image/')) return fail('That file doesn’t look like an image.');

    setStatus('uploading');

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `submissions/${crypto.randomUUID()}.${safeExt}`;

      const { error: uploadErr } = await supabase.storage.from('photos').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

      const { error: insertErr } = await supabase.from('photos').insert({
        title: cleanTitle,
        location: cleanLocation,
        image_path: path,
        status: 'pending',     // ✅ still reviewed
        like_count: 0,
        tags: selectedTags,    // ✅ tags are FINAL
      });

      if (insertErr) throw new Error(`Database insert failed: ${insertErr.message}`);

      setStatus('success');
    } catch (e: any) {
      fail(e?.message ?? 'Something went wrong.');
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
      </p>

      <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ opacity: 0.85 }}>Photo name (required)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Rings & Light"
            required
            style={{ padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: '#0f0f0f', color: 'white', outline: 'none' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ opacity: 0.85 }}>Location (City, State)</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Austin, TX"
            required
            style={{ padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: '#0f0f0f', color: 'white', outline: 'none' }}
          />
        </label>

        <div style={{ display: 'grid', gap: 8 }}>
          <span style={{ opacity: 0.85 }}>Tags (optional)</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {tags.map((t) => {
              const active = selectedTags.includes(t.name);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.name)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: active ? 'rgba(255,77,109,0.25)' : '#0f0f0f',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  #{t.name}
                </button>
              );
            })}
          </div>
        </div>

        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ opacity: 0.85 }}>Photo</span>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ color: '#bdbdbd' }} />
        </label>

        {file ? (
          <div style={{ background: '#0f0f0f', borderRadius: 12, padding: 12, border: '1px solid rgba(255,255,255,0.10)' }}>
            <div style={{ fontSize: 13, color: '#bdbdbd', marginBottom: 10 }}>Preview (not public until approved)</div>
            <img src={previewUrl} alt="preview" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
          </div>
        ) : null}

        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#bdbdbd' }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3 }} />
          <span style={{ lineHeight: 1.4 }}>
            I confirm I own this photo or have permission to share it, it depicts consenting adults only,
            and it follows HandleMe’s submission terms (no nudity, no explicit acts, no minors, no harassment).
          </span>
        </label>

        {status === 'error' ? <div style={{ color: '#ff6b6b' }}>{errorMsg}</div> : null}

        {status === 'success' ? (
          <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', padding: 12, borderRadius: 12 }}>
            <div style={{ fontWeight: 700, color: '#ff4d6d' }}>Submitted ✨</div>
            <div style={{ color: '#bdbdbd', marginTop: 6 }}>Your photo is in the review queue.</div>
            <button
              onClick={resetForm}
              style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: '#0f0f0f', color: 'white', cursor: 'pointer' }}
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
            {status === 'uploading' ? 'Submitting…' : 'Submit'}
          </button>
        )}
      </div>
    </main>
  );
}
