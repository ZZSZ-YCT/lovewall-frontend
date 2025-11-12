export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  const { public: { siteUrl } } = useRuntimeConfig()
  const base = (siteUrl || '').replace(/\/+$/, '') // strip trailing slash

  return [
    'User-agent: *',
    'Disallow: /admin/',
    'Disallow: /me/',
    'Disallow: /notifications',
    'Disallow: /posts/new',
    'Disallow: /auth/',
    'Allow: /',
    '',
    `Sitemap: ${base}/sitemap.xml`
  ].join('\n')
})
