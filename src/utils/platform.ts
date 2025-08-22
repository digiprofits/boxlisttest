export function isStandalone(): boolean {
  const mql = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (navigator as any).standalone === true;
  return !!(mql || iosStandalone);
}
export const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isAndroid = /android/i.test(navigator.userAgent);
export const isEdge = /edg/i.test(navigator.userAgent);
export const isChromeFamily = (/chrome|crios/i.test(navigator.userAgent)) && !isEdge;
