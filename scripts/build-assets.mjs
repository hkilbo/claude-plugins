#!/usr/bin/env node
/**
 * 마켓플레이스 목록(index.json)과 다운로드용 zip 을 만든다.
 * GitHub Action(publish-claude-plugins-{dev,stg,prd}, 수동 실행)이 이 결과를 사내 CDN 의 /claude-plugins/ 아래에 올리고,
 * HERB(인터랙티브 > Claude 스킬)가 index.json 을 읽어 목록·SKILL.md 보기·다운로드를 보여 준다.
 *
 *   node scripts/build-assets.mjs [--out build/claude-plugins]
 *
 * 결과 (경로는 모두 --out 기준):
 *   index.json                                  마켓플레이스·플러그인·스킬 목록
 *   <plugin>/<plugin>.zip                       플러그인 전체 — 풀어서 `claude --plugin-dir` 로 바로 쓸 수 있다
 *   <plugin>/skills/<skill>.zip                 스킬 하나 — `~/.claude/skills/` 에 풀면 바로 쓴다
 *   <plugin>/skills/<skill>/SKILL.md            보기용
 *
 * zip 은 `zip` 명령(macOS·ubuntu-latest 기본 포함)으로 만든다.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO = 'hkilbo/claude-plugins'
const IGNORED = new Set(['.DS_Store', 'Thumbs.db'])

const args = process.argv.slice(2)
const OUT = resolve(ROOT, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'build/claude-plugins')

const readJson = path => JSON.parse(readFileSync(path, 'utf8'))

/** SKILL.md 앞머리에서 한 줄 값·따옴표 값·블록 값(| >)을 읽는다 */
function readFrontmatter(doc) {
  const block = doc.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  const lines = block.split(/\r?\n/)
  const result = {}
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) continue
    const [, key, raw] = match
    if (/^[|>][-+]?$/.test(raw)) {
      const body = []
      while (i + 1 < lines.length && (/^\s/.test(lines[i + 1]) || lines[i + 1] === '')) body.push(lines[++i].trim())
      result[key] = raw.startsWith('|') ? body.join('\n').trim() : body.join(' ').replace(/\s+/g, ' ').trim()
    } else {
      result[key] = raw.trim().replace(/^(['"])([\s\S]*)\1$/, '$2')
    }
  }
  return result
}

function listFiles(directory, base = directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter(entry => !IGNORED.has(entry.name))
    .flatMap(entry => {
      const absolute = join(directory, entry.name)
      return entry.isDirectory() ? listFiles(absolute, base) : [relative(base, absolute).split('\\').join('/')]
    })
    .sort()
}

/** cwd 기준 상대 경로 target 을 zip 으로 묶는다. -X: 파일 메타(uid 등) 빼기 → 같은 입력이면 내용이 같다 */
function zipDirectory(cwd, target, zipPath) {
  mkdirSync(dirname(zipPath), { recursive: true })
  rmSync(zipPath, { force: true })
  execFileSync('zip', ['-r', '-X', '-q', zipPath, target, '-x', '*.DS_Store', '-x', '*Thumbs.db'], { cwd })
}

function gitCommit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

const marketplace = readJson(join(ROOT, '.claude-plugin/marketplace.json'))
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const plugins = marketplace.plugins.map(entry => {
  if (typeof entry.source !== 'string' || !entry.source.startsWith('./'))
    throw new Error(`${entry.name}: source 는 저장소 안 상대 경로(./plugins/...)만 지원합니다.`)
  const pluginDir = join(ROOT, entry.source)
  const manifest = readJson(join(pluginDir, '.claude-plugin/plugin.json'))
  if (manifest.version !== entry.version)
    throw new Error(`${entry.name}: plugin.json(${manifest.version})과 marketplace.json(${entry.version}) 버전이 다릅니다.`)

  const pluginZip = `${entry.name}/${entry.name}.zip`
  zipDirectory(dirname(pluginDir), entry.source.split('/').pop(), join(OUT, pluginZip))

  const skillsDir = join(pluginDir, 'skills')
  const skills = (existsSync(skillsDir) ? readdirSync(skillsDir) : [])
    .filter(folder => existsSync(join(skillsDir, folder, 'SKILL.md')) && statSync(join(skillsDir, folder)).isDirectory())
    .sort()
    .map(folder => {
      const skillDir = join(skillsDir, folder)
      const { name, description } = readFrontmatter(readFileSync(join(skillDir, 'SKILL.md'), 'utf8'))
      const doc = `${entry.name}/skills/${folder}/SKILL.md`
      const zip = `${entry.name}/skills/${folder}.zip`
      mkdirSync(dirname(join(OUT, doc)), { recursive: true })
      copyFileSync(join(skillDir, 'SKILL.md'), join(OUT, doc))
      zipDirectory(skillsDir, folder, join(OUT, zip))
      return { folder, name: name || folder, description: description ?? '', doc, zip, files: listFiles(skillDir) }
    })

  return {
    name: entry.name,
    version: entry.version,
    description: entry.description ?? manifest.description ?? '',
    author: entry.author?.name ?? manifest.author?.name ?? null,
    category: entry.category ?? null,
    keywords: entry.keywords ?? manifest.keywords ?? [],
    homepage: entry.homepage ?? manifest.homepage ?? null,
    installCommand: `/plugin install ${entry.name}@${marketplace.name}`,
    zip: pluginZip,
    skills,
  }
})

const index = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  commit: gitCommit(),
  marketplace: {
    name: marketplace.name,
    description: marketplace.description ?? '',
    repository: `https://github.com/${REPO}`,
    addCommand: `/plugin marketplace add ${REPO}`,
  },
  plugins,
}
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n')

console.log(`${relative(ROOT, OUT)}/`)
for (const plugin of plugins)
  console.log(`  ${plugin.name} ${plugin.version} — 스킬 ${plugin.skills.length}개 (${plugin.skills.map(skill => skill.folder).join(', ')})`)
