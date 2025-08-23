// src/utils/inApp.ts
export const isInAppBrowser = /FBAN|FBAV|FB_IAB|Instagram|Line|MicroMessenger|Snapchat|Twitter|WhatsApp|Messenger|Weibo|WeChat|TikTok|Telegram/i
  .test(navigator.userAgent);
