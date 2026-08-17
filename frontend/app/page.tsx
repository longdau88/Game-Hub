import { GameService } from "../services/GameService";
import { CategoryService } from "../services/CategoryService";
import HomeContent from "../components/home/HomeContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Hub - Chơi Game Trực Tuyến Miễn Phí",
  description: "Game Hub là trang web chơi game miễn phí hàng đầu, nơi bạn có thể khám phá hàng nghìn tựa game hấp dẫn mà không cần tải về hay cài đặt.",
};

// Revalidate page every 5 minutes to keep stats relatively fresh but fast
export const revalidate = 300; 

export default async function Home() {
  let featuredGames = [];
  let mostPlayedGames = [];
  let mostLikedGames = [];
  let newReleases = [];
  let allGames = [];
  let categories = [];

  try {
    const [
      featuredData,
      mostPlayedData,
      mostLikedData,
      newReleasesData,
      allGamesData,
      categoriesData
    ] = await Promise.all([
      GameService.getFeaturedGames().catch((e) => { console.error(e); return []; }),
      GameService.getMostPlayedGames().catch((e) => { console.error(e); return []; }),
      GameService.getMostLikedGames().catch((e) => { console.error(e); return []; }),
      GameService.getPublishedGames({ limit: 10 }).catch((e) => { console.error(e); return []; }),
      GameService.getPublishedGames({ limit: 12, page: 1 }).catch((e) => { console.error(e); return []; }),
      CategoryService.getAllCategories().catch((e) => { console.error(e); return []; })
    ]);

    featuredGames = Array.isArray(featuredData) ? featuredData : [];
    mostPlayedGames = Array.isArray(mostPlayedData) ? mostPlayedData : [];
    mostLikedGames = Array.isArray(mostLikedData) ? mostLikedData : [];
    newReleases = Array.isArray(newReleasesData) ? newReleasesData : (newReleasesData?.games || []);
    allGames = Array.isArray(allGamesData) ? allGamesData : (allGamesData?.games || []);
    categories = Array.isArray(categoriesData) ? categoriesData : [];
  } catch (error) {
    console.error("Failed to fetch initial home data:", error);
  }

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 selection:bg-blue-500/30">
      <HomeContent 
        initialFeaturedGames={featuredGames}
        initialMostPlayedGames={mostPlayedGames}
        initialMostLikedGames={mostLikedGames}
        initialNewReleases={newReleases}
        initialAllGames={allGames}
        categories={categories}
      />
    </div>
  );
}
