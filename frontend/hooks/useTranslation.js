import { useState, useEffect, useCallback } from 'react';
import { translateService } from '../services/translateService';
import { useUser } from './useAuth';

// Hook for translation functionality
export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);
  const [cachedTranslations, setCachedTranslations] = useState({});
  const { user } = useUser();
  const [userLanguage, setUserLanguage] = useState('en');

  // Load user's preferred language
  useEffect(() => {
    if (user) {
      // Get user's preferred language from profile or AsyncStorage
      const loadUserLanguage = async () => {
        try {
          // You can fetch from user profile or AsyncStorage
          // const prefs = await AsyncStorage.getItem('userPreferences');
          // const parsed = JSON.parse(prefs);
          // setUserLanguage(parsed?.language || 'en');
        } catch (error) {
          console.error('Error loading user language:', error);
        }
      };
      loadUserLanguage();
    }
  }, [user]);

  // Translate text with caching
  const translate = useCallback(async (text, targetLang, sourceLang = null) => {
    // If target is English or same as source, return original
    if (!targetLang || targetLang === 'en') {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}_${targetLang}_${sourceLang || 'auto'}`;
    if (cachedTranslations[cacheKey]) {
      return cachedTranslations[cacheKey];
    }

    setIsTranslating(true);
    setError(null);
    try {
      const result = await translateService.translate(text, targetLang, sourceLang);
      
      // Cache the result
      setCachedTranslations(prev => ({
        ...prev,
        [cacheKey]: result,
      }));
      
      setIsTranslating(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsTranslating(false);
      return text; // Return original on error
    }
  }, [cachedTranslations]);

  // Translate multiple texts
  const translateBatch = useCallback(async (texts, targetLang) => {
    if (!targetLang || targetLang === 'en') {
      return texts;
    }

    setIsTranslating(true);
    setError(null);
    try {
      const results = await translateService.translateBatch(texts, targetLang);
      setIsTranslating(false);
      return results;
    } catch (err) {
      setError(err.message);
      setIsTranslating(false);
      return texts;
    }
  }, []);

  // Translate article
  const translateArticle = useCallback(async (article, targetLang) => {
    if (!targetLang || targetLang === 'en') {
      return article;
    }

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
  }, []);

  // Detect language
  const detectLanguage = useCallback(async (text) => {
    try {
      const result = await translateService.detectLanguage(text);
      return result;
    } catch (err) {
      setError(err.message);
      return 'en';
    }
  }, []);

  // Check if translation is needed
  const isTranslationNeeded = useCallback((text, targetLang) => {
    return translateService.isTranslationNeeded(text, targetLang);
  }, []);

  // Clear translation cache
  const clearCache = useCallback(() => {
    setCachedTranslations({});
  }, []);

  // Get translation status
  const getStatus = useCallback(async (text, targetLang) => {
    try {
      const status = await translateService.getTranslationStatus(text, targetLang);
      return status;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    translate,
    translateBatch,
    translateArticle,
    detectLanguage,
    isTranslationNeeded,
    isTranslating,
    error,
    userLanguage,
    setUserLanguage,
    clearCache,
    getStatus,
    cachedTranslations,
  };
}

// Hook for auto-translating content based on user language
export function useAutoTranslate(content, contentLanguage = 'en') {
  const { translate, userLanguage, isTranslating, error } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState(content);
  const [translationNeeded, setTranslationNeeded] = useState(false);

  useEffect(() => {
    const translateContent = async () => {
      // Check if translation is needed
      const needsTranslation = userLanguage !== 'en' && contentLanguage !== userLanguage;
      setTranslationNeeded(needsTranslation);

      if (needsTranslation && content) {
        const translated = await translate(content, userLanguage);
        setTranslatedContent(translated);
      } else {
        setTranslatedContent(content);
      }
    };

    translateContent();
  }, [content, userLanguage, contentLanguage]);

  return {
    content: translatedContent,
    isTranslating,
    error,
    translationNeeded,
    originalContent: content,
  };
}

// Hook for translating lists of content
export function useTranslateList(items, fields = ['title', 'description'], targetLang) {
  const { translateBatch, isTranslating, error } = useTranslation();
  const [translatedItems, setTranslatedItems] = useState(items);

  useEffect(() => {
    const translateItems = async () => {
      if (!targetLang || targetLang === 'en') {
        setTranslatedItems(items);
        return;
      }

      try {
        // For each field, collect all texts to translate
        const textsToTranslate = [];
        const fieldMap = [];

        items.forEach((item, index) => {
          fields.forEach(field => {
            if (item[field]) {
              textsToTranslate.push(item[field]);
              fieldMap.push({ index, field });
            }
          });
        });

        if (textsToTranslate.length === 0) {
          setTranslatedItems(items);
          return;
        }

        // Translate all texts in batch
        const translatedTexts = await translateBatch(textsToTranslate, targetLang);

        // Map translated texts back to items
        const translated = items.map((item, index) => {
          const newItem = { ...item };
          const itemFields = fieldMap.filter(fm => fm.index === index);
          
          itemFields.forEach((fm, i) => {
            const textIndex = fieldMap.findIndex(
              f => f.index === fm.index && f.field === fm.field
            );
            if (textIndex !== -1 && translatedTexts[textIndex]) {
              newItem[fm.field] = translatedTexts[textIndex];
            }
          });

          return newItem;
        });

        setTranslatedItems(translated);
      } catch (error) {
        console.error('Error translating list:', error);
        setTranslatedItems(items);
      }
    };

    translateItems();
  }, [items, targetLang]);

  return {
    items: translatedItems,
    isTranslating,
    error,
  };
}

export default useTranslation;