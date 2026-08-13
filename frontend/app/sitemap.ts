import { MetadataRoute } from 'next'
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://game-hub.best';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/games/trending`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/games/new`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  try {
    // Fetch all games (we can fetch a large limit for sitemap or handle pagination)
    const res = await fetch(`${apiUrl}/api/games?limit=1000`);
    if (res.ok) {
      const data = await res.json();
      const games = Array.isArray(data) ? data : data.games || [];
      
      const gameRoutes: MetadataRoute.Sitemap = games.map((game: any) => ({
        url: `${baseUrl}/game/play?id=${game.id}`,
        lastModified: new Date(game.updatedAt || game.createdAt || new Date()),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
      
      return [...routes, ...gameRoutes];
    }
  } catch (error) {
    console.error("Failed to generate sitemap for games", error);
  }

  return routes;
}
