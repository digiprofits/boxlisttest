// Simple in-app browser & platform detection
export const isInAppBrowser = /FBAN|FBAV|FB_IAB|Instagram|Line|MicroMessenger|Snapchat|Twitter|WhatsApp|Messenger|Weibo|WeChat|TikTok|Telegram/i
  .test(navigator.userAgent);

export const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isAndroid = /android/i.test(navigator.userAgent);
