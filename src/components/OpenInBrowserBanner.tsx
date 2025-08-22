import { isInAppBrowser, isIOS, isAndroid } from '../utils/inApp';

export default function OpenInBrowserBanner(){
  if (!isInAppBrowser) return null;

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4">
      <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2">
        <div className="text-sm">
          {isIOS && (
            <>To install, open this page in <strong>Safari</strong>: tap the <strong>…</strong> or <strong>Share</strong> button and choose <em>Open in Safari</em>.</>
          )}
          {isAndroid && (
            <>To install, open this page in <strong>Chrome</strong>: tap the <strong>⋮</strong> menu and choose <em>Open in Chrome</em>.</>
          )}
          {!isIOS && !isAndroid && <>Open this page in your main browser to install.</>}
        </div>
      </div>
    </div>
  );
}
