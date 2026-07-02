const axios = require('axios');

class TranslationService {
  constructor() {
    this.baseURL = process.env.TRANSLATION_API_URL || 'https://api.mymemory.translated.net/get';
    this.apiEmail = process.env.TRANSLATION_API_EMAIL || null;
    this.cache = new Map();
    this.cacheTTL = 1000 * 60 * 60; // 1 hour cache
  }

  /**
   * Get cache key
   */
  getCacheKey(text, targetLang, sourceLang) {
    return `${text}_${targetLang}_${sourceLang || 'auto'}`;
  }

  /**
   * Check if cached translation exists and is valid
   */
  getCachedTranslation(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value;
    }
    return null;
  }

  /**
   * Store translation in cache
   */
  setCachedTranslation(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Translate text using MyMemory API
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (optional)
   * @returns {Promise<string>} - Translated text
   */
  async translate(text, targetLang, sourceLang = null) {
    try {
      // If target is English or same as source, return original
      if (targetLang === 'en' || !targetLang) {
        return text;
      }

      // If text is empty or too short, return original
      if (!text || text.length < 3) {
        return text;
      }

      // Check cache
      const cacheKey = this.getCacheKey(text, targetLang, sourceLang);
      const cachedResult = this.getCachedTranslation(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Build language pair
      const langPair = sourceLang ? `${sourceLang}|${targetLang}` : `en|${targetLang}`;

      // Prepare params
      const params = {
        q: text,
        langpair: langPair,
      };

      // Add email for higher daily limit
      if (this.apiEmail) {
        params.de = this.apiEmail;
      }

      // Make API request
      const response = await axios.get(this.baseURL, {
        params: params,
        timeout: 10000,
      });

      // Check if translation was successful
      if (response.data && response.data.responseData) {
        const translatedText = response.data.responseData.translatedText;
        
        // Cache the result
        if (translatedText) {
          this.setCachedTranslation(cacheKey, translatedText);
        }
        
        return translatedText || text;
      }

      // If translation failed, return original text
      console.warn('Translation failed, returning original text');
      return text;
    } catch (error) {
      console.error('Translation Service Error:', error.message);
      // Return original text if translation fails
      return text;
    }
  }

  /**
   * Translate multiple texts in batch
   * @param {string[]} texts - Array of texts to translate
   * @param {string} targetLang - Target language code
   * @returns {Promise<string[]>} - Array of translated texts
   */
  async translateBatch(texts, targetLang) {
    try {
      if (targetLang === 'en' || !targetLang) {
        return texts;
      }

      const translations = await Promise.all(
        texts.map(text => this.translate(text, targetLang))
      );
      return translations;
    } catch (error) {
      console.error('Batch Translation Error:', error.message);
      return texts;
    }
  }

  /**
   * Translate article content (title + body)
   * @param {Object} article - Article object with title and body
   * @param {string} targetLang - Target language code
   * @returns {Promise<Object>} - Translated article
   */
  async translateArticle(article, targetLang) {
    try {
      if (targetLang === 'en' || !targetLang) {
        return article;
      }

      // Check if translation is needed
      if (article.language === targetLang) {
        return article;
      }

      const [translatedTitle, translatedBody] = await Promise.all([
        this.translate(article.title, targetLang),
        this.translate(article.body, targetLang),
      ]);

      return {
        ...article,
        title: translatedTitle,
        body: translatedBody,
        translated: true,
        translatedLanguage: targetLang,
        originalLanguage: article.language || 'en',
      };
    } catch (error) {
      console.error('Article Translation Error:', error.message);
      return article;
    }
  }

  /**
   * Detect language of text using MyMemory API
   * @param {string} text - Text to detect language
   * @returns {Promise<string>} - Detected language code
   */
  async detectLanguage(text) {
    try {
      if (!text || text.length < 3) {
        return 'en';
      }

      // MyMemory doesn't have direct language detection
      // Try to detect by translating to multiple languages
      const languages = ['bn', 'hi', 'ur', 'es', 'fr', 'de', 'zh', 'ar', 'ru'];
      
      for (const lang of languages) {
        try {
          const response = await axios.get(this.baseURL, {
            params: {
              q: text,
              langpair: `auto|${lang}`,
            },
            timeout: 5000,
          });

          if (response.data && response.data.responseData) {
            // If translation is different from original, it might be this language
            const translated = response.data.responseData.translatedText;
            if (translated && translated !== text) {
              // Check if translation seems valid (not just symbols)
              if (translated.length > text.length * 0.5) {
                return lang;
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

      return 'en';
    } catch (error) {
      console.error('Language Detection Error:', error.message);
      return 'en';
    }
  }

  /**
   * Check if translation is needed
   * @param {string} text - Text to check
   * @param {string} targetLang - Target language
   * @returns {boolean} - True if translation is needed
   */
  isTranslationNeeded(text, targetLang) {
    // If target is English or empty, no translation needed
    if (targetLang === 'en' || !targetLang) {
      return false;
    }
    
    // If text is empty or too short, no translation needed
    if (!text || text.length < 3) {
      return false;
    }
    
    return true;
  }

  /**
   * Get translation status/info
   * @param {string} text - Text to check
   * @param {string} targetLang - Target language
   * @returns {Promise<Object>} - Translation status
   */
  async getTranslationStatus(text, targetLang) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          q: text,
          langpair: `en|${targetLang}`,
        },
      });

      if (response.data) {
        return {
          success: true,
          data: response.data,
          translatedText: response.data.responseData?.translatedText || null,
          isTranslated: !!response.data.responseData?.translatedText,
          match: response.data.responseData?.match || 0,
          quota: response.data.quotaFinished || false,
          status: response.data.responseStatus || 200,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting translation status:', error);
      return null;
    }
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.cache.clear();
    console.log('Translation cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    const total = this.cache.size;
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const [key, value] of this.cache) {
      if (now - value.timestamp < this.cacheTTL) {
        active++;
      } else {
        expired++;
      }
    }

    return {
      total,
      active,
      expired,
      ttlSeconds: this.cacheTTL / 1000,
    };
  }
}

// Export singleton instance
module.exports = new TranslationService();