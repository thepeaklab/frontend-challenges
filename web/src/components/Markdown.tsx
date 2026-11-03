import ReactMarkdown, { type Components } from 'react-markdown'
import { Link } from 'react-router-dom'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { CHALLENGES } from '../challenges'
import { isExternalUrl, resolvePath } from '../content/paths'
import { assetUrl, githubUrl } from '../content/repo'

interface Props {
  source: string
  /** Repo directory the markdown lives in; relative links and images resolve against it. */
  dir: string
}

function internalTarget(path: string): string | undefined {
  const challenge = CHALLENGES.find((c) => path === c.dir || path.startsWith(`${c.dir}/README`))
  if (challenge) return `/challenge/${challenge.category}/${challenge.slug}`
  if (['html_css', 'js', 'react'].includes(path)) return '/'
  return undefined
}

/** Renders a challenge README with images and links resolved against the repository. */
export function Markdown({ source, dir }: Props) {
  const components: Components = {
    img: ({ src, alt, title }) => {
      const url = typeof src === 'string' && !isExternalUrl(src) ? assetUrl(resolvePath(dir, src)) : src
      return (
        <figure className="md-figure">
          <img src={url as string} alt={alt ?? ''} title={title} loading="lazy" />
          {title && <figcaption>{title}</figcaption>}
        </figure>
      )
    },
    a: ({ href = '', children }) => {
      if (isExternalUrl(href)) {
        return href.startsWith('#') ? (
          <a href={href}>{children}</a>
        ) : (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        )
      }
      const path = resolvePath(dir, href.replace(/\/$/, ''))
      const internal = internalTarget(path)
      if (internal) return <Link to={internal}>{children}</Link>
      return (
        <a href={githubUrl(path)} target="_blank" rel="noreferrer" title="Auf GitHub öffnen">
          {children}
        </a>
      )
    },
    table: ({ children }) => (
      <div className="md-table">
        <table>{children}</table>
      </div>
    ),
  }

  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  )
}

/** Image urls referenced in a README – used as the visual goal of a challenge. */
export function readmeImages(source: string, dir: string): { src: string; alt: string }[] {
  return Array.from(source.matchAll(/!\[([^\]]*)\]\(([^)\s]+)/g))
    .map(([, alt, src]) => ({ alt, src: isExternalUrl(src) ? src : (assetUrl(resolvePath(dir, src)) ?? '') }))
    .filter((image) => image.src)
}
