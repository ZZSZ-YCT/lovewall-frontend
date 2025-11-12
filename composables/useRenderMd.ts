async function render(markdown: string) {
  const { unified } = await import('unified')
  const remarkParse = (await import('remark-parse')).default
  const remarkGfm = (await import('remark-gfm')).default
  const rehypeHighlight = (await import('rehype-highlight')).default
  const rehypeStringify = (await import('rehype-stringify')).default
  const rehypeSlug = (await import('rehype-slug')).default
  const rehypeAutolinkHeadings = (await import('rehype-autolink-headings')).default
  const remarkRehype = (await import('remark-rehype')).default
  const rehypeRaw = (await import('rehype-raw')).default

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true})
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(markdown)

  return String(file)
}

export function useRenderMd() {
  return { render }
}
