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
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    function onBIP(e: any){
      e.preventDefault();
      setBipEvent(e);
      setMode(isAndroid ? 'android' : 'desktop');
      setShow(true);
    }
    window.addEventListener('beforeinstallprompt', onBIP);

    if (isIOS && !isStandalone()) {
      setMode('ios');
      setShow(true);
    }

    if (!isIOS && !isAndroid && isChromeFamily) {
      setMode('desktop');
      setShow(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);

  if (!show || mode === null) return null;

  function dismiss(){
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  }

  async function installNow(){
    if (!bipEvent) { setOpenHelp(true); return; }
    bipEvent.prompt();
    try { await bipEvent.userChoice; } catch {}
    dismiss();
  }

  return (
    <>
      <div className="hidden sm:flex items-center gap-2 ml-auto">
        {mode === 'android' && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={installNow}>Install</button>
            <button className="btn btn-ghost btn-sm" onClick={dismiss} aria-label="Dismiss">✕</button>
          </>
        )}
        {mode === 'ios' && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={()=>setOpenHelp(true)}>How to install</button>
            <button className="btn btn-ghost btn-sm" onClick={dismiss} aria-label="Dismiss">✕</button>
          </>
        )}
        {mode === 'desktop' && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={installNow}>Install</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setOpenHelp(true)}>Where?</button>
            <button className="btn btn-ghost btn-sm" onClick={dismiss} aria-label="Dismiss">✕</button>
          </>
        )}
      </div>

      <div className="sm:hidden ml-auto">
        <button className="btn btn-ghost btn-sm" onClick={mode==='android'||mode==='desktop' ? installNow : ()=>setOpenHelp(true)}>
          Install
        </button>
      </div>

      <Modal open={openHelp} onClose={()=>setOpenHelp(false)} title="Install BoxLister">
        {mode === 'ios' && (
          <ol className="list-decimal pl-5 space-y-2">
            <li>Tap the <strong>Share</strong> icon in Safari.</li>
            <li>Choose <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong>.</li>
          </ol>
        )}
        {mode === 'android' && (
          <ol className="list-decimal pl-5 space-y-2">
            <li>Tap <strong>Install</strong> when prompted.</li>
            <li>If you don’t see it, tap the <strong>⋮ menu</strong> and choose <strong>Install app</strong>.</li>
          </ol>
        )}
        {mode === 'desktop' && (
          <ol className="list-decimal pl-5 space-y-2">
            <li>Click the <strong>Install</strong> icon (or <strong>+</strong>) in your browser’s address bar.</li>
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
