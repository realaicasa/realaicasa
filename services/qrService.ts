import QRCode from 'qrcode';

/**
 * Generates a Data URL for a QR Code
 * @param text The URL or text to encode
 * @returns Promise<string> Base64 Data URL
 */
export const generateQRCode = async (text: string): Promise<string> => {
  try {
    const url = await QRCode.toDataURL(text, {
      margin: 2,
      scale: 10,
      color: {
        dark: '#b89a5b', // Gold-ish to match brand
        light: '#ffffff00' // Transparent background
      },
      errorCorrectionLevel: 'H'
    });
    return url;
  } catch (err) {
    console.error('QR Generation Error:', err);
    return '';
  }
};
