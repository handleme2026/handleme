'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type PhotoRow = {
  id: string;
  title: string | null;
  image_path: string;
  created_at: string;
  status: string;
  like_count: number | null;
};

export default function AdminPage() {
  const [sessionEmail, setSessionEmail] = useState<string>('');
  const [email, setEmail] = useState('');
  const [sendingLink, setSendingLink] = useState(false);

  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PhotoRow[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  function getPublicUrl(image_path: string) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${image_path}`;
  }

  async function loadPending() {
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase
      .from('photos')
      .select('id,title,image_path,created_at,status,like_count')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
      setPending([]);
      setLoading(false);
      return;
    }

    setPending(data ?? []);
    setLoading(false);
  }

  async function approve(id: string) {
    setErrorMsg('');
    const { error } = await supabase.from('photos').update({ status: 'approved' }).eq('id', id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    await loadPending();
  }

  async function reject(id: string) {
    setErrorMsg('');
    const { error } = await supabase.from('photos').update({ status: 'rejected' }).eq('id', id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    await loadPending();
  }

  async function sendMagicLink() {
    setSendingLink(true);
    setErrorMsg('');

const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/admin`,
  },
 });


    if (error) setErrorMsg(error.message);

    setSendingLink(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSessionEmail('');
    setPending([]);
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const s = data.session;
      setSessionEmail(s?.user?.email ?? '');

      if (s?.user) {
        await loadPending();
      } else {
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const e = newSession?.user?.email ?? '';
      setSessionEmail(e);

      if (newSession?.user) {
        await loadPending();
      } else {
        setPending([]);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // If not logged in, show login screen
  if (!sessionEmail) {
    return (
      <main style={{ minHeight: '100vh', background: '#070707', color: 'white', padding: 28, fontFamily: 'sans-serif' }}>
        <h2 style={{ marginTop: 0 }}>HandleMe — Admin</h2>
        <p style={{ color: '#bdbdbd', maxWidth: 720, lineHeight: 1.5 }}>
          Sign in to review submissions. (Magic link gets emailed to you.)
        </p>

        <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin email"
            style={{
              padding: 10,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#0f0f0f',
              color: 'white',
              outline: 'none',
            }}
          />

          <button
            onClick={sendMagicLink}
            disabled={sendingLink || !email}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.18)',
              background: sendingLink ? '#111' : '#ff4d6d',
              color: 'white',
              cursor: sendingLink ? 'not-allowed' : 'pointer',
              fontWeight: 800,
            }}
          >
            {sendingLink ? 'Sending…' : 'Send magic link'}
          </button>

          {errorMsg ? <div style={{ color: '#ff6b6b' }}>{errorMsg}</div> : null}

          <div style={{ fontSize: 12, color: '#7f7f7f' }}>
            After you click the email link, you’ll land back here signed in.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#070707', color: 'white', padding: 28, fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>HandleMe — Admin</h2>
          <div style={{ color: '#bdbdbd', marginTop: 6, fontSize: 13 }}>
            Signed in as {sessionEmail}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadPending}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#0f0f0f',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
          <button
            onClick={signOut}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#0f0f0f',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <p style={{ color: '#bdbdbd', marginTop: 14 }}>
        Pending submissions: <b>{pending.length}</b>
      </p>

      {errorMsg ? <div style={{ color: '#ff6b6b', marginBottom: 12 }}>{errorMsg}</div> : null}

      {loading ? (
        <p style={{ color: '#bdbdbd' }}>Loading…</p>
      ) : pending.length === 0 ? (
        <p style={{ color: '#bdbdbd' }}>No pending submissions right now.</p>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {pending.map((p) => (
            <article
              key={p.id}
              style={{
                background: '#0f0f0f',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <img
                src={getPublicUrl(p.image_path)}
                alt={p.title ?? 'submission'}
                style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block' }}
              />

              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700 }}>{p.title ?? 'Untitled'}</div>
                <div style={{ color: '#9a9a9a', fontSize: 12, marginTop: 6 }}>
                  Submitted: {new Date(p.created_at).toLocaleString()}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button
                    onClick={() => approve(p.id)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#ff4d6d',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 800,
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(p.id)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: '#0f0f0f',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 800,
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
