const isStaticExport = process.env.NEXT_EXPORT === '1'

function normalizeBasePath(value = '') {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '/') {
    return ''
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '')
  return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`
}

const exportBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH)

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: '/games/:slug/',
        destination: '/projects/:slug/',
        permanent: true,
      },
      {
        source: '/work/:slug/',
        destination: '/projects/:slug/',
        permanent: true,
      },
      {
        source: '/cc/',
        destination: '/',
        permanent: true,
      },
      {
        source: '/cc/projects/:slug/',
        destination: '/projects/:slug/',
        permanent: true,
      },
      {
        source: '/cc/consulting/',
        destination: '/consulting/',
        permanent: true,
      },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: isStaticExport,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {
    root: __dirname,
  },
}

if (isStaticExport) {
  nextConfig.output = 'export'
  // Exclude .dev.ts/.dev.tsx files from static export — these are dev-only
  // admin API routes that require a server runtime.
  nextConfig.pageExtensions = ['tsx', 'ts', 'jsx', 'js']
  if (exportBasePath) {
    nextConfig.basePath = exportBasePath
    nextConfig.assetPrefix = exportBasePath
  }
} else {
  // In dev/server mode, include .dev.ts/.dev.tsx for admin API routes
  nextConfig.pageExtensions = ['tsx', 'ts', 'jsx', 'js', 'dev.ts', 'dev.tsx']
}

module.exports = nextConfig
