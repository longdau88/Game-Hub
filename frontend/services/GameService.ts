import { apiClient } from '../api/client';

export interface Game {
  id: string;
  title: string;
  // ... other properties
  [key: string]: any;
}

export class GameService {
  static async getPublishedGames(params?: { search?: string, category?: string, sort?: string, limit?: number, page?: number }): Promise<any> {
    const urlParams = new URLSearchParams();
    if (params?.search) urlParams.append("search", params.search);
    if (params?.category) urlParams.append("category", params.category);
    if (params?.sort) urlParams.append("sort", params.sort);
    if (params?.limit) urlParams.append("limit", params.limit.toString());
    if (params?.page) urlParams.append("page", params.page.toString());
    
    return apiClient.get(`/api/games?${urlParams.toString()}`);
  }

  static async getFeaturedGames(): Promise<Game[]> {
    return apiClient.get<Game[]>('/api/games/featured');
  }

  static async getMostPlayedGames(): Promise<Game[]> {
    return this.getPublishedGames({ sort: 'mostPlayed', limit: 8 });
  }

  static async getMostLikedGames(): Promise<Game[]> {
    return this.getPublishedGames({ sort: 'mostLiked', limit: 10 });
  }

  static async getGameDetails(id: string): Promise<Game> {
    return apiClient.get<Game>(`/api/games/${id}`);
  }

  static async incrementPlayCount(id: string): Promise<void> {
    return apiClient.post<void>(`/api/games/${id}/play`);
  }

  static async getBookmarks(): Promise<{ gameId: string }[]> {
    // Assuming GET /api/games/user/bookmarked returns bookmarks
    return apiClient.get<{ gameId: string }[]>('/api/games/user/bookmarked');
  }
}
