import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nikahqubool.in';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.nikahqubool.in/api';

  const staticPages = [
    '',
    '/about-us',
    '/contact-us',
    '/faq',
    '/privacy-policy',
    '/terms-conditions',
    '/refund-policy',
    '/pricing-policy',
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

  // Fallback defaults in case API is offline or returning empty
  let sects = ['sunni', 'shia', 'syed', 'deobandi', 'barelvi', 'pathan', 'ansari', 'siddiqui'];
  let cities = ['delhi', 'mumbai', 'lucknow', 'hyderabad', 'bareilly', 'noida', 'kanpur', 'aligarh', 'moradabad', 'agra', 'patna', 'bhopal'];
  let professions = ['doctor', 'engineer', 'ca', 'advocate', 'teacher', 'software-engineer', 'business'];

  // 🌐 TRY FETCHING LIVE DYNAMIC MASTER DATA FROM BACKEND API
  try {
    const [sectRes, cityRes, profRes] = await Promise.allSettled([
      fetch(`${apiUrl}/Master/SECT`, { next: { revalidate: 86400 } }),
      fetch(`${apiUrl}/Master/CITIES`, { next: { revalidate: 86400 } }),
      fetch(`${apiUrl}/Master/PROFESSION`, { next: { revalidate: 86400 } }),
    ]);

    if (sectRes.status === 'fulfilled' && sectRes.value.ok) {
      const data = await sectRes.value.json();
      const list = data?.data || data?.Data;
      if (Array.isArray(list) && list.length > 0) {
        sects = Array.from(new Set(list.map((item: any) => 
          (item.value || item.Value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        ).filter(Boolean)));
      }
    }

    if (cityRes.status === 'fulfilled' && cityRes.value.ok) {
      const data = await cityRes.value.json();
      const list = data?.data || data?.Data;
      if (Array.isArray(list) && list.length > 0) {
        cities = Array.from(new Set(list.map((item: any) => 
          (item.value || item.Value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        ).filter(Boolean)));
      }
    }

    if (profRes.status === 'fulfilled' && profRes.value.ok) {
      const data = await profRes.value.json();
      const list = data?.data || data?.Data;
      if (Array.isArray(list) && list.length > 0) {
        professions = Array.from(new Set(list.map((item: any) => 
          (item.value || item.Value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        ).filter(Boolean)));
      }
    }
  } catch (e) {
    // Graceful fallback to static master list if network/API is down
  }

  const generatedSlugs = new Set<string>();

  // 1. Sect + City combinations
  sects.forEach((sect) => {
    cities.forEach((city) => {
      generatedSlugs.add(`${sect}-rishte-in-${city}`);
    });
  });

  // 2. Muslim Matrimony in City
  cities.forEach((city) => {
    generatedSlugs.add(`muslim-matrimony-in-${city}`);
  });

  // 3. Profession specific rishte
  professions.forEach((prof) => {
    generatedSlugs.add(`muslim-${prof}-rishte`);
  });

  // Push all generated dynamic SEO URLs to sitemap
  generatedSlugs.forEach((slug) => {
    routes.push({
      url: `${baseUrl}/matrimony/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  });

  return routes;
}
