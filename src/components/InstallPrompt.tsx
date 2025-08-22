import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { isStandalone, isIOS, isAndroid, isChromeFamily } from '@/utils/platform';

const DISMISS_KEY = 'boxlister.install.dismissed';

export default function InstallPrompt(){
  const [bipEvent, setBipEvent] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'android'|'ios'|'desktop'|null>(null);
  const [openHelp, setOpenHelp] = useState(false);

  useEffect(() => {
    // Already installed? Don't show anything.
    if (isStandalone()) return;

    const dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    if (dismissed) return;

    // Listen for native install prompt (Chrome on Android/Desktop)
    function onBIP(e: any){
      e.preventDefault();         // stash it so we can call prompt() later
      setBipEvent(e);
      // Keep the current mode; if none yet, pick android/desktop
      setMode((m)=> m || (isAndroid ? 'android' : 'desktop'));
      setShow(true);
    }
    window.addEventListener('beforeinstallprompt', onBIP);

    // Decide what to show if no BIP yet (or on iOS which never fires BIP)
    if (isIOS) {
      setMode('ios'); setShow(true);
    } else if (isAndroid) {
      // Show Android helper even if BIP hasn't fired yet (fallback to “⋮ → Install app”)
      setMode('android'); setShow(true);
    } else if (isChromeFamily) {
      setMode('desktop'); setShow(true);
    }

    // If the user actually installs, clear any dismissal so it can reappear after uninstall in the future
    function onAppInstalled(){
      localStorage.removeItem(DISMISS_KEY);
      setShow(false);
    }
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (!show || mode === null) return null;

  function dismiss(){
    // User explicitly chose “Don’t show again”
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  }

  async function installNow(){
    if (!bipEvent) {
      // No captured native prompt → show instructions (⋮ → Install app)
      setOpenHelp(true);
      return;
    }
    bipEvent.prompt();
    try {
      const choice = await bipEvent.userChoice;
      // Only hide permanently if the user DISMISSED the prompt
      if (choice && choice.outcome === 'dismissed') {
        localStorage.setItem(DISMISS_KEY, '1');
      }
    } catch {
      // On any error, don’t set the dismissal flag
    }
    setShow(false);
  }

  return (
    <>
      {/* Desktop/tablet inline controls (right side of top bar) */}
      <div className="hidden sm:flex items-center gap-2 ml-auto">
        {mode === 'android' && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={installNow}>
              Install
            </button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setOpenHelp(true)}>
              How?
            </button>
            <button className="btn btn-ghost btn-sm" onClick={dismiss} aria-label="Dismiss">✕</button>
          </>
        )}
        {mode === 'ios' && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={()=>setOpenHelp(true)}>
              How to install
            </button>
            <button className="btn btn-ghost btn-sm" onClick={dismiss} aria-label="Dismiss">✕</button>
          </>
        )}
        {mode === 'desktop' && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={installNow}>
              Install
            </button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setOpenHelp(true)}>
              Where?
            </button>
            <button className="btn btn-ghost btn-sm" onClick={dismiss} aria-label="Dismiss">✕</button>
          </>
        )}
      </div>

      {/* Small-screen single button */}
      <div className="sm:hidden ml-auto">
        <button
          className="btn btn-ghost btn-sm"
          onClick={mode==='android'||mode==='desktop' ? installNow : ()=>setOpenHelp(true)}
        >
          Install
        </button>
      </div>

      {/* Device-specific help */}
      <Modal open={openHelp} onClose={()=>setOpenHelp(false)} title="Install BoxLister">
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
            <li>If not, tap the <strong>⋮ menu</strong> in Chrome.</li>
            <li>Choose <strong>Install app</strong>.</li>
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
          <button className="btn btn-ghost btn-sm" onClick={dismiss}>Don’t show again</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setOpenHelp(false)}>Close</button>
        </div>
      </Modal>
    </>
  );
}
