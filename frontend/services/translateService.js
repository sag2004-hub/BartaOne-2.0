import { useState } from 'react';
import axios from 'axios';
import { TRANSLATION_API_URL, TRANSLATION_API_EMAIL } from '@env';

// Translation Service using MyMemory API
export const translateService = {
  // Translate single text using MyMemory API
  translate: async (text, targetLang, sourceLang = null) => {
    try {
      // If target language is English or same as source, return original
      if (targetLang === 'en' || !targetLang) {
        return text;
      }

      // If text is empty or too short, return original
      if (!text || text.length < 3) {
        return text;
      }

      // Build the language pair
      const langPair = sourceLang ? `${sourceLang}|${targetLang}` : `en|${targetLang}`;

      // Prepare request params
      const params = {
        q: text,
        langpair: langPair,
      };

      // Add email if provided for higher daily limit
      if (TRANSLATION_API_EMAIL) {
        params.de = TRANSLATION_API_EMAIL;
      }

      // Make API request to MyMemory
      const response = await axios.get(TRANSLATION_API_URL || 'https://api.mymemory.translated.net/get', {
        params: params,
        timeout: 10000, // 10 seconds timeout
      });

      // Check if translation was successful
      if (response.data && response.data.responseData) {
        // Check if there was a warning (partial translation)
        if (response.data.responseData.translatedText) {
          return response.data.responseData.translatedText;
        }
      }

      // If translation failed, return original text
      console.warn('Translation failed, returning original text');
      return text;
    } catch (error) {
      console.error('Translation error:', error);
      // Return original text if translation fails
      return text;
    }
  },

  // Translate multiple texts in batch
  translateBatch: async (texts, targetLang) => {
    try {
      if (targetLang === 'en' || !targetLang) {
        return texts;
      }

      // Translate texts one by one (MyMemory doesn't support batch)
      const translations = await Promise.all(
        texts.map(text => translateService.translate(text, targetLang))
      );
      return translations;
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts;
    }
  },

  // Translate article content (title + body)
  translateArticle: async (article, targetLang) => {
    try {
      if (targetLang === 'en' || !targetLang) {
        return article;
      }

      const [translatedTitle, translatedBody] = await Promise.all([
        translateService.translate(article.title, targetLang),
        translateService.translate(article.body, targetLang),
      ]);

      return {
        ...article,
        title: translatedTitle,
        body: translatedBody,
        translated: true,
        translatedLanguage: targetLang,
      };
    } catch (error) {
      console.error('Article translation error:', error);
      return article;
    }
  },

  // Detect language using MyMemory API
  detectLanguage: async (text) => {
    try {
      if (!text || text.length < 3) {
        return 'en';
      }

      // MyMemory doesn't have direct language detection,
      // but we can detect by checking if translation is needed
      // Try to translate to English and check the source language
      const response = await axios.get(TRANSLATION_API_URL || 'https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair: 'en|en',
        },
        timeout: 5000,
      });

      // If the response contains language detection info
      if (response.data && response.data.responseData) {
        // Try to extract language from the response
        // MyMemory sometimes includes language info in the response
        return 'en'; // Default to English
      }
      return 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  },

  // Check if translation is needed
  isTranslationNeeded: (text, targetLang) => {
    if (targetLang === 'en' || !targetLang) return false;
    if (!text || text.length < 3) return false;
    return true;
  },

  // Get translation status/info
  getTranslationStatus: async (text, targetLang) => {
    try {
      const response = await axios.get(TRANSLATION_API_URL || 'https://api.mymemory.translated.net/get', {
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
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting translation status:', error);
      return null;
    }
  },
};

// React Hook for translation
export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);

  const translate = async (text, targetLang, sourceLang = null) => {
    setIsTranslating(true);
    setError(null);
    try {
      const result = await translateService.translate(text, targetLang, sourceLang);
      setIsTranslating(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsTranslating(false);
      return text;
    }
  };

  const translateBatch = async (texts, targetLang) => {
    setIsTranslating(true);
    setError(null);
    try {
      const result = await translateService.translateBatch(texts, targetLang);
      setIsTranslating(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsTranslating(false);
      return texts;
    }
  };

  const translateArticle = async (article, targetLang) => {
    setIsTranslating(true);
    setError(null);
    try {
      const result = await translateService.translateArticle(article, targetLang);
      setIsTranslating(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsTranslating(false);
      return article;
    }
  };

  const detectLanguage = async (text) => {
    setIsTranslating(true);
    setError(null);
    try {
      const result = await translateService.detectLanguage(text);
      setIsTranslating(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsTranslating(false);
      return 'en';
    }
  };

  return {
    translate,
    translateBatch,
    translateArticle,
    detectLanguage,
    isTranslating,
    error,
  };
}

// Export individual functions for convenience
export const {
  translate: translateText,
  translateBatch: translateBatchTexts,
  translateArticle: translateArticleContent,
  detectLanguage: detectTextLanguage,
  isTranslationNeeded,
  getTranslationStatus,
} = translateService;

export default translateService;