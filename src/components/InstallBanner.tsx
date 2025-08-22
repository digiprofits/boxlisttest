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
    if (isStandalone()) return;                               // already installed
    if (localStorage.getItem(DISMISS_KEY) === '1') return;    // user hid banner

    // Decide the mode immediately so we can show a banner even if BIP is throttled
    if (isIOS) setMode('ios');
    else if (isAndroid) setMode('android');
    else if (isChromeFamily) setMode('desktop');

    // Listen for native prompt (Android/Desktop Chrome)
    function onBIP(e: any) {
      e.preventDefault();
      setBipEvent(e);
      if (!mode) setMode(isAndroid ? 'android' : 'desktop');
      setShow(true);
    }
    window.addEventListener('beforeinstallprompt', onBIP);

    // If no BIP (e.g., iOS or throttled), still show the banner
    setShow(true);

    function onAppInstalled() {
      localStorage.removeItem(DISMISS_KEY);
      setShow(false);
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
    if (!bipEvent) { setOpenHelp(true); return; }             // fallback instructions
    try {
      const choice = await bipEvent.userChoice;
      if (choice && choice.outcome === 'dismissed') {
        localStorage.setItem(DISMISS_KEY, '1');               // only persist if they dismissed
      }
    } catch {}
    setShow(false);
    bipEvent.prompt?.();                                      // prompt after awaiting (some Chromium require prompt first)
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 px-3 py-2 flex items-center gap-2">
          {/* Message varies by device */}
          <span className="text-sm">
            {mode === 'ios' && <>Install to home screen for a full-screen experience.</>}
            {mode === 'android' && <>Install BoxLister for faster access and offline use.</>}
            {mode === 'desktop' && <>Install BoxLister as an app for quick access.</>}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {mode !== 'ios' && (
              <button className="btn btn-primary btn-sm" onClick={installNow}>Install</button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setOpenHelp(true)}
            >
              {mode === 'ios' ? 'How to install' : 'How?'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={dismiss} aria-label="Dismiss">✕</button>
          </div>
        </div>
      </div>

      {/* Device-specific help */}
      <Modal open={openHelp} onClose={() => setOpenHelp(false)} title="Install BoxLister">
        {mode === 'ios' && (
          <ol className="list-decimal pl-5 space-y-2">
            <li>Open this page in <strong>Safari</strong>.</li>
            <li>Tap the <strong>Share</strong> icon.</li>
            <li>Choose <strong>Add to Home Screen</strong> → <strong>Add</strong>.</li>
          </ol>
        )}
        {mode === 'android' && (
          <ol className="list-decimal pl-5 space-y-2">
            <li>If prompted, tap <strong>Install</strong>.</li>
            <li>If not, tap the <strong>⋮ menu</strong> in Chrome.</li>
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
