// Builds the three language versions of the page and their share images, with the words in docs/locales.
// docs/index.html is the source and also the English page; docs/ja and docs/fr are generated from it.
// docs/social/og.{en,ja,fr}.png are screenshots of docs/social/og.html, and docs/apple-touch-icon.png of docs/favicon.svg, taken with the Chrome on this machine.
//
//   node scripts/build-site.mjs
//   CHROME=/path/to/chrome node scripts/build-site.mjs

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SITE = 'https://hypergeojson.kamataryo.com/'
const LOCALES = { en: 'en_US', ja: 'ja_JP', fr: 'fr_FR' }
const CODES = Object.keys(LOCALES)
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const docs = path => fileURLToPath(new URL(`../docs/${path}`, import.meta.url))
const wordsOf = code => JSON.parse(readFileSync(docs(`locales/${code}.json`), 'utf8'))
const pageOf = code => SITE + (code === 'en' ? '' : `${code}/`)
const text = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const attribute = s => text(s).replace(/"/g, '&quot;')

// Puts one language's words into a page: the text of each [data-i18n] element, the attribute each [data-i18n-*] names
function localize(html, code) {
  const words = wordsOf(code)
  const word = key => {
    if (typeof words[key] !== 'string') throw new Error(`docs/locales/${code}.json has no "${key}"`)
    return words[key]
  }
  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${code}">`)
    .replace(/(<[a-z][^<>]*\sdata-i18n="([^"]+)"[^<>]*>)[^<]*/g, (_, tag, key) => tag + text(word(key)))
    .replace(/<[a-z][^<>]*\sdata-i18n-[^<>]*>/g, tag => {
      for (const [, name, key] of tag.matchAll(/data-i18n-([a-z-]+)="([^"]+)"/g))
        tag = tag.replace(new RegExp(`(\\s${name}=")[^"]*`), (_, start) => start + attribute(word(key)))
      return tag
    })
}

// What a link preview reads: crawlers do not run the page's script, so this has to be in the HTML
function share(code) {
  const words = wordsOf(code)
  return `<!-- share: written by scripts/build-site.mjs -->
<meta name="description" content="${attribute(words.lede)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="HyperGeoJSON">
<meta property="og:title" content="HyperGeoJSON">
<meta property="og:description" content="${attribute(words.lede)}">
<meta property="og:url" content="${pageOf(code)}">
<meta property="og:locale" content="${LOCALES[code]}">
${CODES.filter(other => other !== code).map(other => `<meta property="og:locale:alternate" content="${LOCALES[other]}">`).join('\n')}
<meta property="og:image" content="${SITE}social/og.${code}.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attribute(words['og.imageAlt'])}">
<meta name="twitter:card" content="summary_large_image">
${CODES.map(other => `<link rel="alternate" hreflang="${other}" href="${pageOf(other)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${pageOf('en')}">
<!-- /share -->`
}

// ---- the pages ----

const source = readFileSync(docs('index.html'), 'utf8')
for (const code of CODES) {
  const html = localize(source, code)
    .replace(/<!-- share[\s\S]*?<!-- \/share -->/, () => share(code))
    .replace(/ aria-current="page"/, '')
    .replace(new RegExp(`(<a href="[^"]*" lang="${code}")`), '$1 aria-current="page"')
  if (code === 'en') { writeFileSync(docs('index.html'), html); continue }
  mkdirSync(docs(code), { recursive: true })
  // <base> lets every relative URL in the page mean the same thing here as in docs/index.html
  writeFileSync(docs(`${code}/index.html`), html.replace(/<script>[\s\S]*?<\/script>\n/, '').replace('<meta charset="utf-8">\n', `<meta charset="utf-8">
<base href="../">
<!-- Generated from ../index.html by scripts/build-site.mjs: edit that file, not this one -->
`))
  console.log(`Wrote docs/${code}/index.html`)
}

// ---- the share images ----

const image = readFileSync(docs('social/og.html'), 'utf8')
const work = mkdtempSync(join(tmpdir(), 'hypergeojson-site-')) // a profile of its own, so that a Chrome already running does not take over the job
function screenshot(page, path, width, height) {
  const png = docs(path)
  execFileSync(chrome, [
    '--headless', `--user-data-dir=${join(work, 'profile')}`, '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${width},${height}`, '--virtual-time-budget=5000', // long enough for the web fonts
    `--screenshot=${png}`, pathToFileURL(page).href,
  ], { stdio: 'pipe' })
  // Bytes 16 and 20 of a PNG hold its width and height
  const file = readFileSync(png), size = [file.readUInt32BE(16), file.readUInt32BE(20)]
  if (size[0] !== width || size[1] !== height) throw new Error(`${path} came out ${size.join('×')}, not ${width}×${height}`)
  console.log(`Wrote docs/${path}`)
}
try {
  for (const code of CODES) {
    const html = join(work, `og.${code}.html`)
    writeFileSync(html, localize(image, code))
    screenshot(html, `social/og.${code}.png`, 1200, 630)
  }
  screenshot(docs('favicon.svg'), 'apple-touch-icon.png', 180, 180)
} finally {
  rmSync(work, { recursive: true, force: true })
}
