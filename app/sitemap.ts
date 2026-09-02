import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nikahqubool.in';

  const staticPages = [
    '',
    '/about-us',
    '/contact-us',
    '/faq',
    '/privacy-policy',
    '/terms-conditions',
    '/safety-tips',
    '/dashboard/find-match',
    '/dashboard/membership',
  ];

  const routes: MetadataRoute.Sitemap = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic Matrimony SEO Landing pages
  const seoLandingSlugs = [
    'sunni-rishte-in-delhi',
    'muslim-matrimony-in-mumbai',
    'syed-rishte-in-lucknow',
    'deobandi-matrimony-in-hyderabad',
    'muslim-doctor-rishte',
    'muslim-engineer-rishte',
  ];

  seoLandingSlugs.forEach((slug) => {
    routes.push({
      url: `${baseUrl}/matrimony/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  });

  return routes;
}
