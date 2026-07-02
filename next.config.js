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

// Mirror theme.json's font host into a NEXT_PUBLIC_* env so the root layout can
// BUILD-TIME gate the next/font import (M2). Next inlines this literal and dead-
// code-eliminates the self-host branch on `google` builds, so a Google-fonts
// site never ships preload <link>s for self-hosted woff2 nothing references.
// theme.json stays the single source of truth (this only derives from it).
const themeFonts = require('./src/content/theme.json').fonts
const fontsHost = themeFonts && themeFonts.host === 'self' ? 'self' : 'google'

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_FONTS_HOST: fontsHost,
  },
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
