import { type MetadataRoute } from 'next'

import { CANONICAL_URL } from '@/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: CANONICAL_URL + '/sitemap.xml',
  }
}
