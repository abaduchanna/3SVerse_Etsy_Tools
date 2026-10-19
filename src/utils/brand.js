// Shared extension branding — single source of truth for reports and background scripts.

export const EXT_NAME = '3SVerse Etsy Tools';
export const EXT_TAGLINE = 'Open-source local Etsy research suite';
export const EXT_SITE = 'https://github.com/abaduchanna/3SVerse_Etsy_Tools';

export function extVersionLabel() {
  try {
    return `${EXT_NAME} v${chrome.runtime.getManifest().version}`;
  } catch {
    return EXT_NAME;
  }
}
