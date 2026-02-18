'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type DbPhoto = {
  id: string;
  title: string | null;
  image_path: string;
  created_at: string;
  like_count: number | null;
};

type LikePhotoResult = {
  incremented: boolean;
  new_like_count: number;
};

export default function GalleryPage() {
  const [photos, setPhotos] = useState<DbPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest');

  useEffect(() => {
    fetchPhotos();
  }, []);

  async function fetchPhotos() {
    setLoading(true);

    const { data, error } = await supabase
      .from('photos')
      .select('id,title,image_path,created_at,like_count')
      .eq('status', 'approved');

    if (error) {
      console.error('Supabase fetch error:', error);
      setLoading(false);
      return;
    }

    setPhotos(data ?? []);
    setLoading(false);
  }

  function getPublicUrl(image_path: string) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${image_path}`;
  }

  function getAnonFingerprint() {
    const key = 'hm_fp';
    let fp = localStorage.getItem(key);
    if (!fp) {
      fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, fp);
    }
    return fp;
  }

  async function likePhoto(photoId: string) {
    const fp = getAnonFingerprint();

    const { data, error } = await supabase.rpc('like_photo', {
      p_photo_id: photoId,
      p_anon_fingerprint: fp
    });

    if (error) {
      console.error('RPC like_photo error:', error);
      return;
    }

    const result = (Array.isArray(data) ? data[0] : data) as LikePhotoResult | undefined;

    setPhotos(prev =>
      prev.map(p =>
        p.id === photoId
          ? { ...p, like_count: result?.new_like_count ?? (p.like_count ?? 0) }
          : p
      )
    );
  }

  const displayed = useMemo(() => {
    const list = [...photos];

    if (sortBy === 'likes') {
      list.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [photos, sortBy]);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#070707', color: 'white', padding: 28, fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>HandleMe — Gallery</h2>
        <a href="/" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>← Home</a>
      </header>

      <div style={{ marginBottom: 18 }}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'likes')}
          style={{ padding: 8, borderRadius: 10, background: '#0f0f0f', color: 'white' }}
        >
          <option value="newest">Newest</option>
          <option value="likes">Most liked</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: '#bdbdbd' }}>Loading approved photos…</p>
      ) : displayed.length === 0 ? (
        <p style={{ color: '#bdbdbd' }}>No approved photos yet.</p>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {displayed.map(photo => (
            <article key={photo.id} style={{ background: '#0f0f0f', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={getPublicUrl(photo.image_path)}
                  alt={photo.title ?? 'hand'}
                  style={{ width: '100%', height: 320, objectFit: 'cover' }}
                />
                <button
                  onClick={() => likePhoto(photo.id)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    bottom: 10,
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    padding: '8px 10px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    color: '#ff4d6d',
                    fontWeight: 700
                  }}
                >
                  ♥ {photo.like_count ?? 0}
                </button>
              </div>
              <div style={{ padding: 12 }}>
                {photo.title ?? 'Untitled'}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
