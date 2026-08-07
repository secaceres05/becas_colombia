import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://becascolombia.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://becascolombia.com/becas', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://becascolombia.com/internacionales', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://becascolombia.com/universidades', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://becascolombia.com/admisiones', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];
}
