import { useEffect, useState } from 'react';
import { isStandalone, isIOS, isAndroid, isChromeFamily } from '@/utils/platform';
import { isInAppBrowser } from '@/utils/inApp'; // if you didn't add this before, see step 3

const DISMISS_KEY = 'boxlister.installGate.dismissed';

export default function InstallGate() {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'ios'|'android'|'desktop'|null>(null);
  const [bipEvent, setBipEvent] = useState<any>(null); // beforeinstallprompt
  const [helpOpen, setHelpOpen] = useState(false);

  // Show only when not installed and not previously dismissed
  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    if (isIOS) setMode('ios');
    else if (isAndroid) setMode('android');
    else if (isChromeFamily) setMode('desktop');
    else setMode('desktop');

    setShow(true);

    function onBIP(e: any) {
      e.preventDefault();      // keep the event so we can call prompt() later
      setBipEvent(e);
    }
    function onInstalled() {
      localStorage.removeItem(DISMISS_KEY);
      setShow(false);
      setBipEvent(null);
    }
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!show || !mode) return null;

  async function installNow() {
    // iOS never provides a native prompt
    if (mode === 'ios') { setHelpOpen(true); return; }
    if (!bipEvent) { setHelpOpen(true); return; }  // Chrome throttled → show steps
    try {
      // Must call prompt() first, then await userChoice
      bipEvent.prompt();
      const choice = await bipEvent.userChoice;
      if (choice && choice.outcome === 'dismissed') {
        // Persist only if they explicitly dismissed the native prompt
        localStorage.setItem(DISMISS_KEY, '1');
      }
    } catch {/* ignore */}
    setShow(false);
    setBipEvent(null);
  }

  function continueInBrowser() {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      <div className="mx-auto max-w-6xl h-full flex flex-col">
        {/* Top hint for in-app browsers (WhatsApp, FB, etc.) */}
        {isInAppBrowser && (
          <div className="px-4 pt-3">
            <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
              {isIOS ? (
                <>To install, open this page in <strong>Safari</strong>: tap the <strong>…</strong> or <strong>Share</strong> button and choose <em>Open in Safari</em>.</>
              ) : (
                <>To install, open this page in <strong>Chrome</strong>: tap the <strong>⋮</strong> menu and choose <em>Open in Chrome</em>.</>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <img src="/logo.png" alt="BoxLister" className="mx-auto mb-4 h-12 w-12 rounded-lg" />

            <h1 className="text-2xl font-bold mb-2">Install BoxLister</h1>
            <p className="text-neutral-600 mb-8">
              Get quick access, full-screen mode, and offline support.
            </p>

            {/* Primary CTA */}
            <button className="btn btn-primary w-full mb-3" onClick={installNow}>
              Install
            </button>

            {/* Secondary link */}
            <button className="btn btn-ghost w-full" onClick={continueInBrowser}>
              or continue without installing
            </button>

            {/* Small help link */}
            <div className="mt-4 text-sm text-neutral-600">
              {mode === 'ios' ? (
                <button className="underline" onClick={() => setHelpOpen(true)}>
                  How to install on iPhone / iPad
                </button>
              ) : (
                <button className="underline" onClick={() => setHelpOpen(true)}>
                  Where is the Install button?
                </button>
              )}
            </div>

            {/* Help content (simple inline drawer) */}
            {helpOpen && (
              <div className="mt-6 text-left rounded-xl border p-4 text-sm">
                {mode === 'ios' && (
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Open this page in <strong>Safari</strong>.</li>
                    <li>Tap the <strong>Share</strong> icon.</li>
                    <li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
                    <li>Launch the app from your home screen.</li>
                  </ol>
                )}
                {mode !== 'ios' && (
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>If a prompt appears, tap <strong>Install</strong>.</li>
                    <li>If not, open the <strong>⋮</strong> menu in Chrome and select <strong>Install app</strong>.</li>
                    <li>Open the app from your home screen / launcher.</li>
                  </ol>
                )}
                <div className="mt-3 text-right">
                  <button className="btn btn-ghost btn-sm" onClick={() => setHelpOpen(false)}>Close</button>
                </div>
              </div>
            )}

            <p className="mt-6 text-xs text-neutral-500">
              (After installing, your device adds a home-screen icon. Some platforms won’t auto-launch the app.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
