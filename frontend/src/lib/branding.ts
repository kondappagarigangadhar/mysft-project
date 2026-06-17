/** Product & company branding (text-only; do not use for storage keys). */
export const PRODUCT_NAME = 'mySFT';
export const PRODUCT_WEBSITE = 'mySFT.ai';
export const COMPANY_NAME = 'Requanto Technologies Private Limited';
export const COMPANY_SHORT = 'Requanto Technologies';
export const COMPANY_WEBSITE = 'Requanto.ai';

export const BROWSER_TITLE = 'mySFT';
export const BROWSER_TITLE_DEFAULT = 'mySFT';
export const BROWSER_TITLE_TEMPLATE = '%s | mySFT';

export const FOOTER_POWERED_BY = 'Powered by Requanto Technologies';
export const LOGIN_TAGLINE = 'Real estate · Unified SaaS';
export const LOGIN_MOBILE_TAGLINE = 'Construction & real estate';

export const LOGO_FULL_SRC = '/mysft-logo.png';
export const LOGO_ICON_SRC = '/mysft-icon.png';
/** Browser tab favicon — must stay `/mysft-icon.png` (public file). */
export const FAVICON_SRC = '/mysft-icon.png';

export function pageTitle(section: string): string {
    return `${section} | ${PRODUCT_NAME}`;
}
