import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sarvadamodernschool.com'
  
  const routes = [
    '',
    '/about',
    '/academics',
    '/admissions',
    '/news',
    '/contact',
    '/compliance',
    '/trust',
    '/notices',
    '/student-life',
    '/faculty',
    '/gallery',
    '/results',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))
 
  return routes
}
