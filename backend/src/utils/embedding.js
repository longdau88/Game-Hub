const { pipeline } = require('@xenova/transformers');

class EmbeddingService {
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      // Use a lightweight embedding model
      this.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return this.instance;
  }

  static async generateEmbedding(text) {
    try {
      const extractor = await this.getInstance();
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }
}

module.exports = EmbeddingService;
