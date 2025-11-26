export type RegionGroupKey =
  | 'africa_me_india'      // Africa, Middle East, and India
  | 'asia_pacific'         // Asia Pacific
  | 'europe'               // Europe
  | 'latam_caribbean'      // Latin America and the Caribbean
  | 'us_canada_pr'         // The United States, Canada, and Puerto Rico

export interface Region {
  id: string
  name: string
  language: string
  group: RegionGroupKey
}

export const REGION_GROUP_KEYS: RegionGroupKey[] = [
  'africa_me_india',
  'asia_pacific',
  'europe',
  'latam_caribbean',
  'us_canada_pr',
]

export const REGIONS: Region[] = [
  // Africa, Middle East, and India
  { id: 'za', name: 'South Africa',     language: 'en',   group: 'africa_me_india' },
  { id: 'ng', name: 'Nigeria',          language: 'en',   group: 'africa_me_india' },
  { id: 'ke', name: 'Kenya',            language: 'sw',   group: 'africa_me_india' },
  { id: 'tz', name: 'Tanzania',         language: 'sw',   group: 'africa_me_india' },
  { id: 'sa', name: 'المملكة العربية السعودية', language: 'ar', group: 'africa_me_india' },
  { id: 'ae', name: 'الإمارات العربية المتحدة', language: 'ar', group: 'africa_me_india' },
  { id: 'ir', name: 'ایران',            language: 'fa',   group: 'africa_me_india' },
  { id: 'in', name: 'भारत',            language: 'hi',   group: 'africa_me_india' },

  // Asia Pacific
  { id: 'jp', name: '日本',             language: 'ja',   group: 'asia_pacific' },
  { id: 'cn', name: '中国大陆',         language: 'zh-CN',group: 'asia_pacific' },
  { id: 'tw', name: '臺灣',             language: 'zh-TW',group: 'asia_pacific' },
  { id: 'hk', name: '香港',             language: 'zh-TW',group: 'asia_pacific' },
  { id: 'kr', name: '대한민국',         language: 'ko',   group: 'asia_pacific' },
  { id: 'th', name: 'ประเทศไทย',        language: 'th',   group: 'asia_pacific' },
  { id: 'vn', name: 'Việt Nam',        language: 'vi',   group: 'asia_pacific' },
  { id: 'id', name: 'Indonesia',       language: 'id',   group: 'asia_pacific' },
  { id: 'my', name: 'Malaysia',        language: 'ms',   group: 'asia_pacific' },
  { id: 'sg', name: 'Singapore',       language: 'en',   group: 'asia_pacific' },
  { id: 'au', name: 'Australia',       language: 'en',   group: 'asia_pacific' },
  { id: 'nz', name: 'New Zealand',     language: 'en',   group: 'asia_pacific' },

  // Europe
  { id: 'uk', name: 'United Kingdom',  language: 'en',   group: 'europe' },
  { id: 'de', name: 'Deutschland',     language: 'de',   group: 'europe' },
  { id: 'fr', name: 'France',          language: 'fr',   group: 'europe' },
  { id: 'es', name: 'España',          language: 'es',   group: 'europe' },
  { id: 'it', name: 'Italia',          language: 'it',   group: 'europe' },
  { id: 'nl', name: 'Nederland',       language: 'nl',   group: 'europe' },
  { id: 'se', name: 'Sverige',         language: 'sv',   group: 'europe' },
  { id: 'dk', name: 'Danmark',         language: 'da',   group: 'europe' },
  { id: 'fi', name: 'Suomi',           language: 'fi',   group: 'europe' },
  { id: 'pl', name: 'Polska',          language: 'pl',   group: 'europe' },
  { id: 'ro', name: 'România',         language: 'ro',   group: 'europe' },
  { id: 'hu', name: 'Magyarország',    language: 'hu',   group: 'europe' },
  { id: 'ru', name: 'Россия',          language: 'ru',   group: 'europe' },
  { id: 'ua', name: 'Україна',         language: 'uk',   group: 'europe' },
  { id: 'gr', name: 'Ελλάδα',          language: 'el',   group: 'europe' },

  // Latin America and the Caribbean
  { id: 'mx', name: 'México',          language: 'es',   group: 'latam_caribbean' },
  { id: 'br', name: 'Brasil',          language: 'pt',   group: 'latam_caribbean' },
  { id: 'ar', name: 'Argentina',       language: 'es',   group: 'latam_caribbean' },
  { id: 'cl', name: 'Chile',           language: 'es',   group: 'latam_caribbean' },
  { id: 'co', name: 'Colombia',        language: 'es',   group: 'latam_caribbean' },
  { id: 'pe', name: 'Perú',            language: 'es',   group: 'latam_caribbean' },
  { id: 'cr', name: 'Costa Rica',      language: 'es',   group: 'latam_caribbean' },
  { id: 'pr', name: 'Puerto Rico',     language: 'es',   group: 'latam_caribbean' },

  // The United States, Canada, and Puerto Rico
  { id: 'us', name: 'United States',   language: 'en',   group: 'us_canada_pr' },
  { id: 'ca', name: 'Canada',          language: 'en',   group: 'us_canada_pr' },
  { id: 'pr-us', name: 'Puerto Rico',  language: 'es',   group: 'us_canada_pr' },
]
