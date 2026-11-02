import { atLeast, computed, fail, keyframesRules, mediaRules, pass, styleRules } from '../checks/helpers'
import { repoFile, repoFiles } from '../content/repo'
import { reference } from './reference'
import type { Challenge } from './types'

const HELLO_WORLD_STARTER = `<html>
  <body>
    hello world
  </body>
</html>
`

const helloWorld: Challenge = {
  id: 'html_css/01_hello-world',
  category: 'html_css',
  slug: '01_hello-world',
  number: 1,
  title: 'Hello World',
  summary: 'Deine erste HTML-Seite: Überschriften, Absätze und Listen.',
  topics: ['HTML', 'Tags'],
  kind: 'web',
  dir: 'html_css/01_hello-world',
  entry: 'index.html',
  files: { 'index.html': HELLO_WORLD_STARTER },
  reference: reference('html_css/01_hello-world'),
  checks: [
    {
      id: 'boilerplate',
      title: 'Boilerplate mit <html> und <body>',
      run: ({ files }) =>
        /<html[\s>]/i.test(files['index.html']) && /<body[\s>]/i.test(files['index.html'])
          ? pass()
          : fail('Deine Datei braucht ein <html>- und ein <body>-Tag.'),
    },
    {
      id: 'headings',
      title: 'Mindestens 5 Überschriften',
      run: ({ doc }) => atLeast(doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length, 5, 'Überschriften (h1–h6)'),
    },
    {
      id: 'paragraphs',
      title: 'Mindestens 3 Absätze',
      run: ({ doc }) =>
        atLeast(
          Array.from(doc.querySelectorAll('p')).filter((p) => p.textContent?.trim()).length,
          3,
          'Absätze (<p> mit Text)',
        ),
    },
    {
      id: 'lists',
      title: 'Mindestens 2 Listen',
      run: ({ doc }) => atLeast(doc.querySelectorAll('ul, ol').length, 2, 'Listen (<ul> oder <ol>)'),
    },
    {
      id: 'list-items',
      title: 'Jede Liste hat mindestens 4 Listenelemente',
      run: ({ doc }) => {
        const lists = Array.from(doc.querySelectorAll('ul, ol'))
        const short = lists.filter((list) => list.querySelectorAll(':scope > li').length < 4)
        if (lists.length < 2) return fail('Lege zuerst mindestens 2 Listen an.')
        return short.length === 0 ? pass() : fail(`${short.length} Liste(n) haben weniger als 4 <li>-Elemente.`)
      },
    },
    {
      id: 'single-h1',
      title: 'Genau eine <h1> als Hauptüberschrift',
      optional: true,
      run: ({ doc }) => {
        const count = doc.querySelectorAll('h1').length
        return count === 1
          ? pass()
          : fail(`Gefunden: ${count}. Eine Seite sollte genau eine <h1> haben – nutze für Unterabschnitte <h2>–<h6>.`)
      },
    },
  ],
}

const basics: Challenge = {
  id: 'html_css/02_basics',
  category: 'html_css',
  slug: '02_basics',
  number: 2,
  title: 'Basics',
  summary: 'Doctype, Head, CSS-Grundlagen, Positioning und Media Queries.',
  topics: ['HTML', 'CSS', 'Positioning', 'Responsive'],
  kind: 'web',
  dir: 'html_css/02_basics',
  entry: 'index.html',
  files: { 'index.html': repoFile('html_css/02_basics/index.html') },
  reference: reference('html_css/02_basics'),
  checks: [
    {
      id: 'doctype',
      task: 'Challenge 1 – Doctype & Head',
      title: 'Die Datei beginnt mit <!DOCTYPE html>',
      run: ({ files }) =>
        /^\s*(<!--[\s\S]*?-->\s*)*<!doctype html>/i.test(files['index.html'])
          ? pass()
          : fail('Setze <!DOCTYPE html> ganz an den Anfang der Datei.'),
    },
    {
      id: 'charset',
      task: 'Challenge 1 – Doctype & Head',
      title: 'Meta-Tag charset="utf-8"',
      run: ({ doc }) =>
        doc.querySelector('meta[charset]')?.getAttribute('charset')?.toLowerCase() === 'utf-8'
          ? pass()
          : fail('Ergänze <meta charset="utf-8" /> im <head>.'),
    },
    {
      id: 'viewport',
      task: 'Challenge 1 – Doctype & Head',
      title: 'Meta-Tag viewport',
      run: ({ doc }) =>
        /width=device-width/.test(doc.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '')
          ? pass()
          : fail('Ergänze <meta name="viewport" content="width=device-width, initial-scale=1.0" />.'),
    },
    {
      id: 'title',
      task: 'Challenge 1 – Doctype & Head',
      title: 'Die Seite hat einen <title>',
      run: ({ doc }) => (doc.title.trim() ? pass(`„${doc.title.trim()}“`) : fail('Der <title> fehlt oder ist leer.')),
    },
    {
      id: 'rules',
      task: 'Challenge 2 – Styles',
      title: 'Mindestens 8 CSS-Regeln',
      run: ({ doc }) => atLeast(styleRules(doc, /./).length, 8, 'CSS-Regeln'),
    },
    {
      id: 'class-selectors',
      task: 'Challenge 2 – Styles',
      title: 'Klassen-Selektoren werden genutzt',
      run: ({ doc }) =>
        styleRules(doc, /\.[a-z_-]/i).length > 0
          ? pass()
          : fail('Nutze Klassennamen wie .content oder .footer als Selektor statt nur Tag-Namen.'),
    },
    {
      id: 'content-width',
      task: 'Challenge 2 – Styles',
      title: 'Der Inhalt ist in der Breite begrenzt und zentriert',
      run: (ctx) => {
        const content = ctx.doc.querySelector('.content')
        if (!content) return fail('Das Element mit der Klasse .content fehlt.')
        const rect = content.getBoundingClientRect()
        const viewport = ctx.win.innerWidth
        if (rect.width > viewport * 0.8) return fail('.content ist noch fast so breit wie das Fenster – probiere max-width.')
        const offset = Math.abs(rect.left - (viewport - rect.right))
        return offset < 40 ? pass() : fail('.content ist noch nicht horizontal zentriert – probiere margin: 0 auto.')
      },
    },
    {
      id: 'font',
      task: 'Challenge 2 – Styles',
      title: 'Eigene Schriftart',
      optional: true,
      run: (ctx) => {
        const family = computed(ctx, ctx.doc.body).fontFamily
        return /times|^serif$/i.test(family) ? fail('Der Body nutzt noch die Standard-Schrift des Browsers.') : pass(family)
      },
    },
    {
      id: 'footer',
      task: 'Challenge 2 – Styles',
      title: 'Der Footer hebt sich farblich ab',
      optional: true,
      run: (ctx) => {
        const footer = ctx.doc.querySelector('footer')
        if (!footer) return fail('Kein <footer> gefunden.')
        return computed(ctx, footer).backgroundColor !== 'rgba(0, 0, 0, 0)'
          ? pass()
          : fail('Gib dem Footer eine Hintergrundfarbe.')
      },
    },
    {
      id: 'header',
      task: 'Challenge 3 – Header & Positioning',
      title: 'Ein <header> mit Logo',
      run: ({ doc }) => {
        const header = doc.querySelector('header')
        if (!header) return fail('Füge ein <header>-Element hinzu.')
        return header.querySelector('img')
          ? pass()
          : fail('Im Header fehlt das Logo – nutze <img src="assets/logo.png" />.')
      },
    },
    {
      id: 'nav',
      task: 'Challenge 3 – Header & Positioning',
      title: 'Eine Navigation mit Links im Header',
      run: ({ doc }) => {
        const nav = doc.querySelector('header nav')
        if (!nav) return fail('Füge im Header ein <nav>-Element hinzu.')
        return atLeast(nav.querySelectorAll('a').length, 2, 'Links (<a>) in der Navigation')
      },
    },
    {
      id: 'sticky',
      task: 'Challenge 3 – Header & Positioning',
      title: 'Der Header bleibt beim Scrollen sichtbar',
      run: (ctx) => {
        const header = ctx.doc.querySelector('header')
        if (!header) return fail('Kein <header> gefunden.')
        const position = computed(ctx, header).position
        return position === 'sticky' || position === 'fixed'
          ? pass(`position: ${position}`)
          : fail(`Der Header hat position: ${position}. Schau dir sticky oder fixed an.`)
      },
    },
    {
      id: 'media-query',
      task: 'Challenge 4 – Media Queries',
      title: 'Eine Media Query mit min-width',
      run: ({ doc }) =>
        mediaRules(doc).some((rule) => /min-width/.test(rule.media.mediaText))
          ? pass()
          : fail('Lege Desktop-Styles in @media screen and (min-width: 768px) { … } ab.'),
    },
    {
      id: 'mobile-first',
      task: 'Challenge 4 – Media Queries',
      title: 'Mobile first: ohne Media Query ist der Inhalt volle Breite',
      optional: true,
      run: ({ doc }) => {
        const outside = styleRules(doc, /\.content/).filter(
          (rule) => rule.parentRule?.constructor.name !== 'CSSMediaRule' && rule.style.maxWidth,
        )
        return outside.length === 0
          ? pass()
          : fail('max-width von .content steht noch außerhalb der Media Query – auf dem Handy soll der Inhalt die volle Breite nutzen.')
      },
    },
  ],
}

const NEWSPAPER_STARTER = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The New York Times</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <!-- Bilder findest du unter assets/, z.B. <img src="assets/nyt-car-image.png" /> -->
  </body>
</html>
`

const newspaper: Challenge = {
  id: 'html_css/03_newspaper',
  category: 'html_css',
  slug: '03_newspaper',
  number: 3,
  title: 'Newspaper',
  summary: 'Baue die Titelseite der New York Times möglichst detailgetreu nach.',
  topics: ['Layout', 'Grid', 'Webfonts'],
  kind: 'web',
  dir: 'html_css/03_newspaper',
  entry: 'index.html',
  files: { 'index.html': NEWSPAPER_STARTER, 'styles.css': '/* Dein Layout */\n' },
  checks: [
    {
      id: 'masthead',
      title: 'Der Zeitungskopf „The New York Times“',
      run: ({ doc }) =>
        /new york times/i.test(doc.body.textContent ?? '')
          ? pass()
          : fail('Der Name der Zeitung fehlt noch auf der Seite.'),
    },
    {
      id: 'webfont',
      title: 'Ein Webfont ist eingebunden',
      run: ({ doc, files }) => {
        const css = Object.values(files).join('\n')
        return doc.querySelector('link[href*="fonts.googleapis.com"]') || /@font-face|fonts\.googleapis\.com/.test(css)
          ? pass()
          : fail('Binde eine passende Schrift von Google Fonts ein (<link> oder @import).')
      },
    },
    {
      id: 'images',
      title: 'Mindestens 3 Bilder werden angezeigt',
      run: async ({ doc, waitFor }) => {
        const loaded = () =>
          Array.from(doc.images).filter((img) => img.complete && img.naturalWidth > 0).length
        await waitFor(() => loaded() >= 3, 2000)
        return atLeast(loaded(), 3, 'geladene Bilder')
      },
    },
    {
      id: 'headlines',
      title: 'Mindestens 4 Artikel-Überschriften',
      run: ({ doc }) => atLeast(doc.querySelectorAll('h2, h3, h4').length, 4, 'Überschriften (h2–h4)'),
    },
    {
      id: 'columns',
      title: 'Ein mehrspaltiges Layout',
      run: ({ doc, win }) => {
        for (const el of Array.from(doc.body.querySelectorAll('*'))) {
          const style = win.getComputedStyle(el)
          if (style.display.includes('grid') && style.gridTemplateColumns.split(' ').length >= 3) return pass('CSS Grid')
          if (style.columnCount !== 'auto' && Number(style.columnCount) > 1) return pass('CSS Columns')
          if (style.display.includes('flex') && style.flexDirection === 'row' && el.children.length >= 3) return pass('Flexbox')
        }
        return fail('Die Titelseite braucht mehrere Spalten – CSS Grid ist dafür ideal.')
      },
    },
    {
      id: 'semantic',
      title: 'Semantische Elemente: header, main, article',
      optional: true,
      run: ({ doc }) => {
        const missing = ['header', 'main', 'article'].filter((tag) => !doc.querySelector(tag))
        return missing.length === 0 ? pass() : fail(`Noch nicht verwendet: ${missing.map((t) => `<${t}>`).join(', ')}`)
      },
    },
  ],
}

const COMPONENT_STARTER = (name: string) => `/* Styles für .${name} */\n`

const cssAnimations: Challenge = {
  id: 'html_css/04_css-animations',
  category: 'html_css',
  slug: '04_css-animations',
  number: 4,
  title: 'CSS-Animations',
  summary: 'Vier Buttons mit Hover- und Active-States, Pseudoelementen und Keyframes.',
  topics: ['Transitions', 'Keyframes', 'Pseudoelemente'],
  kind: 'web',
  dir: 'html_css/04_css-animations',
  entry: 'index.html',
  readOnly: ['index.html'],
  files: {
    'index.html': repoFile('html_css/04_css-animations/index.html'),
    'css/styles.css': repoFile('html_css/04_css-animations/css/styles.css'),
    'css/components/btn-modern.css': COMPONENT_STARTER('btn-modern'),
    'css/components/btn-fade-in.css': COMPONENT_STARTER('btn-fade-in'),
    'css/components/btn-fancy.css': COMPONENT_STARTER('btn-fancy'),
    'css/components/btn-shake.css': COMPONENT_STARTER('btn-shake'),
  },
  reference: repoFiles('html_css/04_css-animations/solutions'),
  checks: [
    {
      id: 'imports',
      task: 'Organisation',
      title: 'styles.css importiert alle vier Komponenten',
      run: ({ files }) => {
        const css = files['css/styles.css'] ?? ''
        const missing = ['btn-modern', 'btn-fade-in', 'btn-fancy', 'btn-shake'].filter(
          (name) => !new RegExp(`@import[^;]*components/${name}\\.css`).test(css),
        )
        return missing.length === 0
          ? pass()
          : fail(`Fehlende @import-Regeln: ${missing.map((n) => `components/${n}.css`).join(', ')}`)
      },
    },
    {
      id: 'modern-radius',
      task: '01 – Modern',
      title: 'Abgerundete Ecken und Transition',
      run: (ctx) => {
        const style = computed(ctx, ctx.doc.querySelector('.btn-modern')!)
        if (style.borderTopLeftRadius === '0px') return fail('Der Button hat noch keine abgerundeten Ecken (border-radius).')
        return style.transitionDuration.split(',').some((d) => parseFloat(d) > 0)
          ? pass()
          : fail('Ohne transition springen die Zustände – füge eine transition hinzu.')
      },
    },
    {
      id: 'modern-hover',
      task: '01 – Modern',
      title: 'Schatten beim Hovern',
      run: ({ doc }) =>
        styleRules(doc, /\.btn-modern[^,]*:hover/).some((rule) => rule.style.boxShadow)
          ? pass()
          : fail('Gib .btn-modern:hover einen box-shadow.'),
    },
    {
      id: 'modern-active',
      task: '01 – Modern',
      title: 'Transparenz beim Klick',
      run: ({ doc }) =>
        styleRules(doc, /\.btn-modern[^,]*:active/).some((rule) => rule.style.opacity)
          ? pass()
          : fail('Nutze .btn-modern:active mit opacity.'),
    },
    {
      id: 'fade-text',
      task: '02 – Fade-In',
      title: 'Der Text verschiebt sich beim Hovern',
      run: ({ doc }) =>
        styleRules(doc, /\.btn-fade-in[^,]*:hover[^,]*\.btn-fade-in-text/).length > 0
          ? pass()
          : fail('Style .btn-fade-in-text, wenn der Button gehovert wird (.btn-fade-in:hover .btn-fade-in-text).'),
    },
    {
      id: 'fade-icon',
      task: '02 – Fade-In',
      title: 'Ein Icon per Pseudoelement',
      run: ({ doc }) =>
        styleRules(doc, /\.btn-fade-in[^,]*::(after|before)/).some((rule) => rule.style.content)
          ? pass()
          : fail('Das Markup darf nicht verändert werden – das Icon entsteht mit ::after und content.'),
    },
    {
      id: 'fade-active',
      task: '02 – Fade-In',
      title: 'Das Icon wechselt beim Klick',
      run: ({ doc }) =>
        styleRules(doc, /\.btn-fade-in[^,]*:active[^,]*::(after|before)/).some((rule) => rule.style.content)
          ? pass()
          : fail('Ändere content des Pseudoelements im :active-Zustand.'),
    },
    {
      id: 'fancy-shadow',
      task: '03 – Fancy',
      title: 'Harter Retro-Schatten',
      run: (ctx) =>
        computed(ctx, ctx.doc.querySelector('.btn-fancy')!).boxShadow !== 'none'
          ? pass()
          : fail('Der Retro-Look entsteht durch einen box-shadow ohne Unschärfe.'),
    },
    {
      id: 'fancy-pseudo',
      task: '03 – Fancy',
      title: 'Die Ecken des Schattens mit ::before und ::after',
      run: ({ doc }) => {
        const before = styleRules(doc, /\.btn-fancy[^,]*::before/).length > 0
        const after = styleRules(doc, /\.btn-fancy[^,]*::after/).length > 0
        return before && after ? pass() : fail('Nutze ::before und ::after für die abgeschrägten Ecken des Schattens.')
      },
    },
    {
      id: 'fancy-states',
      task: '03 – Fancy',
      title: 'Der Button wird beim Hovern und Klicken „gedrückt“',
      run: ({ doc }) => {
        const hover = styleRules(doc, /\.btn-fancy[^,]*:hover/).length > 0
        const active = styleRules(doc, /\.btn-fancy[^,]*:active/).length > 0
        return hover && active ? pass() : fail('Es fehlen Styles für :hover und/oder :active.')
      },
    },
    {
      id: 'shake-keyframes',
      task: '04 – Shake',
      title: '@keyframes-Animation definiert',
      run: ({ doc }) =>
        keyframesRules(doc).length > 0 ? pass() : fail('Definiere die Wackel-Bewegung mit @keyframes.'),
    },
    {
      id: 'shake-hover',
      task: '04 – Shake',
      title: 'Die Animation startet beim Hovern',
      run: ({ doc }) =>
        styleRules(doc, /\.btn-shake[^,]*:hover/).some((rule) => rule.style.animationName && rule.style.animationName !== 'none')
          ? pass()
          : fail('Starte die Animation in .btn-shake:hover mit animation: <name> …'),
    },
    {
      id: 'mine',
      task: '05 – Make it yours!',
      title: 'Dein eigener Button (.btn-mine)',
      optional: true,
      run: ({ doc }) =>
        styleRules(doc, /\.btn-mine/).length > 0 ? pass() : fail('Gestalte .btn-mine – lege dafür gern eine eigene Datei an.'),
    },
  ],
}

const TAILWIND_SCRIPT = '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.11"></script>'

const tailwind: Challenge = {
  id: 'html_css/05_tailwind',
  category: 'html_css',
  slug: '05_tailwind',
  number: 5,
  title: 'Tailwind',
  summary: 'Style die Hello-World News nur mit Tailwind-Utility-Klassen.',
  topics: ['Tailwind', 'Utility-first', 'Responsive'],
  kind: 'web',
  dir: 'html_css/05_tailwind',
  // The prepared markup references assets/logo.png from the basics challenge.
  assetDirs: ['html_css/02_basics'],
  entry: 'index.html',
  settleMs: 800,
  files: {
    'index.html': repoFile('html_css/05_tailwind/index.html').replace(
      '<style>',
      `<!-- Tailwind läuft hier direkt im Browser, ein Build-Schritt ist nicht nötig -->\n    ${TAILWIND_SCRIPT}\n    <style>`,
    ),
  },
  reference: reference('html_css/05_tailwind'),
  checks: [
    {
      id: 'script',
      title: 'Tailwind ist eingebunden',
      run: ({ doc }) =>
        doc.querySelector('script[src*="tailwind"]') ? pass() : fail(`Binde Tailwind ein: ${TAILWIND_SCRIPT}`),
    },
    {
      id: 'classes',
      title: 'Mindestens 20 Elemente mit Utility-Klassen',
      run: ({ doc }) => atLeast(doc.body.querySelectorAll('[class]:not([class=""])').length, 20, 'Elemente mit Klassen'),
    },
    {
      id: 'sticky',
      title: 'Der Header bleibt beim Scrollen sichtbar',
      run: (ctx) => {
        const header = ctx.doc.querySelector('header')
        const position = header ? computed(ctx, header).position : 'static'
        return position === 'sticky' || position === 'fixed'
          ? pass()
          : fail('Nutze die Klassen sticky top-0 (oder fixed) am Header.')
      },
    },
    {
      id: 'responsive',
      title: 'Responsive Varianten (md:, lg:, …)',
      run: ({ doc }) => {
        const classes = Array.from(doc.body.querySelectorAll('[class]')).flatMap((el) => Array.from(el.classList))
        return classes.some((name) => /^(sm|md|lg|xl|2xl):/.test(name))
          ? pass()
          : fail('Mit Präfixen wie md: legst du Styles für größere Bildschirme fest.')
      },
    },
    {
      id: 'no-custom-css',
      title: 'Kein eigenes CSS hinzugefügt',
      optional: true,
      run: ({ files }) => {
        const style = /<style>([\s\S]*?)<\/style>/.exec(files['index.html'])?.[1] ?? ''
        const rules = (style.match(/\{/g) ?? []).length
        return rules <= 3 ? pass() : fail('Versuche alles mit Tailwind-Klassen statt eigenem CSS zu lösen.')
      },
    },
  ],
}

export const htmlCssChallenges = [helloWorld, basics, newspaper, cssAnimations, tailwind]
