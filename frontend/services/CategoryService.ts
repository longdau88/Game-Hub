import { apiClient } from '../api/client';

export interface Category {
  id: number;
  name: string;
  slug: string;
  nameTranslations?: any;
}

export class CategoryService {
  static async getAllCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/api/categories');
  }

  static async createCategory(data: Partial<Category>): Promise<Category> {
    return apiClient.post<Category>('/api/categories', data);
  }

  static async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    return apiClient.put<Category>(`/api/categories/${id}`, data);
  }

  static async deleteCategory(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/categories/${id}`);
  }
}
