import type { Metadata, ResolvingMetadata } from "next";
import ClientPage from "./ClientPage";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const id = resolvedSearchParams?.id;
  if (!id) {
    return {
      title: "Play Game | Game Hub",
      description: "Play awesome web games directly in your browser. Chơi game hành động 3D, game giải đố miễn phí.",
    };
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Fetch game details to populate SEO
    const res = await fetch(`${apiUrl}/api/games/${id}`, { cache: "no-store" });
    if (!res.ok) {
      return {
        title: "Game Not Found | Game Hub",
        description: "The game you are looking for does not exist.",
      };
    }
    const game = await res.json();
    
    const title = game.title || "Play Game";
    // Construct SEO friendly description with targeted keywords
    const baseDesc = game.description ? game.description.substring(0, 100) : "Play awesome web games directly in your browser";
    const description = `${title} - ${baseDesc}... Chơi game hành động 3D trên web, game giải đố miễn phí và hàng ngàn tựa game hấp dẫn khác tại Game Hub.`;
    
    return {
      title: `${title} | Game Hub`,
      description: description,
      keywords: [title, "chơi game miễn phí", "chơi game web", "game hành động 3D", "game giải đố", ...(game.categories?.map((c: any) => c.name) || [])],
      openGraph: {
        title: `${title} | Game Hub`,
        description: description,
        images: game.coverImageUrl ? [game.coverImageUrl] : [],
      },
    };
  } catch (error) {
    console.error("Failed to generate metadata for game", error);
    return {
      title: "Play Game | Game Hub",
      description: "Play awesome web games directly in your browser. Chơi game hành động 3D, game giải đố miễn phí.",
    };
  }
}

export default async function Page({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const id = resolvedSearchParams?.id;
  let game = null;
  
  if (id) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/${id}`, { cache: "no-store" });
      if (res.ok) {
        game = await res.json();
      }
    } catch (error) {
      console.error("Failed to fetch game for schema", error);
    }
  }

  const jsonLd = game ? {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": game.title,
    "description": game.description,
    "image": game.coverImageUrl,
    "genre": game.categories?.map((c: any) => c.name) || ["Web Game"],
    "url": `https://game-hub.best/game/play?id=${id}`,
    "playMode": "SinglePlayer",
    "applicationCategory": "Game",
    "operatingSystem": "Web Browser",
    "aggregateRating": game.totalRatings > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": game.averageRating || 5,
      "ratingCount": game.totalRatings || 1
    } : undefined
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ClientPage />
    </>
  );
}
