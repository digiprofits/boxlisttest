import { useEffect, useState } from 'react';
import { isStandalone, isIOS, isAndroid, isChromeFamily } from '@/utils/platform';
import Modal from '@/components/Modal';

const DISMISS_KEY = 'boxlister.install.dismissed';

export default function InstallBanner() {
  const [bipEvent, setBipEvent] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'android'|'ios'|'desktop'|null>(null);
  const [openHelp, setOpenHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    // Decide mode immediately so the banner shows even if BIP is throttled
    if (isIOS) setMode('ios');
    else if (isAndroid) setMode('android');
    else if (isChromeFamily) setMode('desktop');

    function onBIP(e: any) {
      // keep the event so we can call prompt() later
      e.preventDefault();
      setBipEvent(e);
      if (!mode) setMode(isAndroid ? 'android' : 'desktop');
      setShow(true);
    }
    window.addEventListener('beforeinstallprompt', onBIP);

    // Show banner regardless (gives “How?” fallback when BIP not available)
    setShow(true);

    function onAppInstalled() {
      localStorage.removeItem(DISMISS_KEY);
      setShow(false);
      setBipEvent(null);
    }
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show || !mode) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  }

  async function installNow() {
    // If Chrome hasn't given us the native event, show instructions
    if (!bipEvent) {
      setOpenHelp(true);
      return;
    }
    try {
      // ✅ correct order: prompt first, then await userChoice
      bipEvent.prompt();
      const choice = await bipEvent.userChoice;
      if (choice && choice.outcome === 'dismissed') {
        // only persist if they explicitly dismissed the native prompt
        localStorage.setItem(DISMISS_KEY, '1');
      }
    } catch {
      /* ignore */
    } finally {
      setShow(false);
      setBipEvent(null);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 px-3 py-2 flex items-center gap-2">
          <span className="text-sm">
            {mode === 'ios' && <>Install to home screen for a full-screen experience.</>}
            {mode === 'android' && <>Install BoxLister for faster access and offline use.</>}
            {mode === 'desktop' && <>Install BoxLister as an app for quick access.</>}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {mode !== 'ios' && (
              <button className="btn btn-primary btn-sm" onClick={installNow}>
                Install
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => setOpenHelp(true)}>
              {mode === 'ios' ? 'How to install' : 'How?'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={dismiss} aria-label="Dismiss">✕</button>
          </div>
        </div>
      </div>

      <Modal open={openHelp} onClose={() => setOpenHelp(false)} title="Install BoxLister">
        {mode === 'ios' && (
          <ol className="list-decimal pl-5 space-y-2">
            <li>Open in <strong>Safari</strong>.</li>
            <li>Tap the <strong>Share</strong> icon.</li>
            <li>Choose <strong>Add to Home Screen</strong> → <strong>Add</strong>.</li>
          </ol>
        )}
        {mode === 'android' && (
          <ol className="list-decimal pl-5 space-y-2">
            <li>If prompted, tap <strong>Install</strong>.</li>
            <li>If not, tap the <strong>⋮</strong> menu in Chrome.</li>
            <li>Select <strong>Install app</strong>.</li>
          </ol>
        )}
        {mode === 'desktop' && (
          <ol className="list-decimal pl-5 space-y-2">
            <li>Click the <strong>Install</strong> (or <strong>+</strong>) icon in the address bar.</li>
            <li>Confirm to add the app.</li>
          </ol>
        )}
        <div className="mt-4 flex justify-end gap-2">
          {mode !== 'ios' && <button className="btn btn-primary btn-sm" onClick={installNow}>Install</button>}
          <button className="btn btn-ghost btn-sm" onClick={() => setOpenHelp(false)}>Close</button>
        </div>
      </Modal>
    </>
  );
}
