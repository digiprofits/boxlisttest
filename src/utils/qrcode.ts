import QRCode from 'qrcode';

export async function makeQRDataURL(text: string, size = 256) {
  return QRCode.toDataURL(text, { width: size, margin: 1 });
}