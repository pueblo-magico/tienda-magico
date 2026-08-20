import { createHash } from 'node:crypto'
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '..', '..')

function usage() {
  console.log(`Usage:
  npm run build-artifact -- \\
    --tag RELEASE_TAG \\
    --shop-url https://shop.example.com \\
    --cms-url https://cms.example.com \\
    [--platform linux/arm64|linux/amd64] \\
    [--output-directory PATH]

Defaults:
  --platform linux/arm64
  --output-directory artifacts/manual`)
}

function fail(message) {
  console.error(`ERROR: ${message}`)
  process.exit(1)
}

function parseArguments(arguments_) {
  const options = {
    platform: 'linux/arm64',
    outputDirectory: join(repositoryRoot, 'artifacts', 'manual'),
  }

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]
    if (argument === '--help' || argument === '-h') {
      usage()
      process.exit(0)
    }

    const value = arguments_[index + 1]
    if (!value || value.startsWith('--')) fail(`${argument} requires a value.`)

    switch (argument) {
      case '--tag':
        options.tag = value
        break
      case '--shop-url':
        options.shopUrl = value
        break
      case '--cms-url':
        options.cmsUrl = value
        break
      case '--platform':
        options.platform = value
        break
      case '--output-directory':
        options.outputDirectory = isAbsolute(value)
          ? value
          : resolve(repositoryRoot, value)
        break
      default:
        fail(`Unknown option: ${argument}`)
    }
    index += 1
  }

  if (!options.tag) fail('Missing required option --tag.')
  if (!/^[A-Za-z0-9._-]+$/.test(options.tag)) {
    fail('The release tag may contain only letters, numbers, dots, underscores, and hyphens.')
  }
  if (!options.shopUrl) fail('Missing required option --shop-url.')
  if (!options.cmsUrl) fail('Missing required option --cms-url.')
  if (!['linux/arm64', 'linux/amd64'].includes(options.platform)) {
    fail('--platform must be linux/arm64 or linux/amd64.')
  }

  for (const [name, value] of [
    ['--shop-url', options.shopUrl],
    ['--cms-url', options.cmsUrl],
  ]) {
    let url
    try {
      url = new URL(value)
    } catch {
      fail(`${name} must be a valid absolute HTTP or HTTPS URL.`)
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      fail(`${name} must use HTTP or HTTPS.`)
    }
    if (url.pathname !== '/' || url.search || url.hash) {
      fail(`${name} must be an origin without a path, query, or fragment.`)
    }
  }

  return options
}

function run(command, arguments_, label, options = {}) {
  console.log(`\n==> ${label}`)
  const result = spawnSync(command, arguments_, {
    cwd: repositoryRoot,
    stdio: 'inherit',
    shell: false,
    ...options,
  })
  if (result.error?.code === 'ENOENT') fail(`${command} was not found in PATH.`)
  if (result.error) fail(`${label} could not start: ${result.error.message}`)
  if (result.status !== 0) fail(`${label} failed with exit code ${result.status}.`)
}

async function sha256(file) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

const options = parseArguments(process.argv.slice(2))
const artifact = join(options.outputDirectory, `tienda-magico-${options.tag}.tar`)
const checksumFile = `${artifact}.sha256`

run('docker', ['info'], 'Checking Docker')
mkdirSync(options.outputDirectory, { recursive: true })

run(
  'docker',
  [
    'buildx', 'build', '--load', '--platform', options.platform,
    '-f', 'deploy/docker/storefront.Dockerfile',
    '--build-arg', `NEXT_PUBLIC_SITE_URL=${options.shopUrl}`,
    '--build-arg', `PAYLOAD_ECOMMERCE_URL=${options.cmsUrl}`,
    '--build-arg', `PAYLOAD_CMS_URL=${options.cmsUrl}`,
    '--build-arg', `NEXT_PUBLIC_CMS_URL=${options.cmsUrl}`,
    '--build-arg', `CMS_MEDIA_ORIGIN=${options.cmsUrl}`,
    '-t', `tienda-magico/storefront:${options.tag}`,
    '.',
  ],
  `Building storefront for ${options.platform}`,
)

run(
  'docker',
  [
    'buildx', 'build', '--load', '--platform', options.platform,
    '-f', 'apps/cms/Dockerfile',
    '--build-arg', `NEXT_PUBLIC_SERVER_URL=${options.cmsUrl}`,
    '--build-arg', `PAYLOAD_PUBLIC_SERVER_URL=${options.cmsUrl}`,
    '-t', `tienda-magico/cms:${options.tag}`,
    'apps/cms',
  ],
  `Building CMS for ${options.platform}`,
)

run(
  'docker',
  ['pull', '--platform', options.platform, 'postgres:16-alpine'],
  'Fetching PostgreSQL image',
)
run(
  'docker',
  ['pull', '--platform', options.platform, 'caddy:2-alpine'],
  'Fetching Caddy image',
)

run(
  'docker',
  [
    'save', '-o', artifact,
    `tienda-magico/storefront:${options.tag}`,
    `tienda-magico/cms:${options.tag}`,
    'postgres:16-alpine',
    'caddy:2-alpine',
  ],
  `Exporting ${artifact}`,
)

const checksum = await sha256(artifact)
writeFileSync(checksumFile, `${checksum}  ${artifact.split(/[\\/]/).at(-1)}\n`, 'ascii')

console.log(`
Artifact created successfully:
  ${artifact}
  ${checksumFile}
  SHA256: ${checksum}`)
