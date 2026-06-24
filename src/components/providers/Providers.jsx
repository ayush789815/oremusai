'use client';

import { useEffect, useState } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store } from '@/redux/store.js';
import Toaster from '@/components/ui/Toaster.jsx';

// Applies the persisted theme to <html> exactly like the original App.jsx effect.
function ThemeSync() {
  const theme = useSelector((s) => s.ui.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return null;
}

// The original app is a pure SPA (blank until React mounts). We replicate that
// exactly with a mount gate: server + first client render produce identical
// output (nothing), so there is never a hydration mismatch from persisted
// localStorage state (theme, auth, selected org). Children render after mount.
export default function Providers({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Dev helper — run window.__resetZoho() in browser console to force the
  // Zoho connection popup to reappear (clears local token + session skip flag).
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      window.__resetZoho = () => {
        localStorage.removeItem('oremus_zoho_v1');
        sessionStorage.removeItem('oremus_zoho_modal_skipped');
        location.reload();
      };
    }
  }, []);

  return (
    <Provider store={store}>
      <ThemeSync />
      {mounted ? children : null}
      <Toaster />
    </Provider>
  );
}
