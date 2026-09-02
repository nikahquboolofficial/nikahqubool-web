import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/settings', '/dashboard/messages', '/api/'],
      },
    ],
    sitemap: 'https://nikahqubool.in/sitemap.xml',
  };
}
