const { sendResponse, sendError } = require('../utils/response');
const translationService = require('../services/translationService');

// Translate text
exports.translate = async (req, res) => {
  try {
    const { text, targetLang, sourceLang } = req.body;

    if (!text) {
      return sendError(res, 400, 'Text is required');
    }

    if (!targetLang) {
      return sendError(res, 400, 'Target language is required');
    }

    const translatedText = await translationService.translate(text, targetLang, sourceLang);

    return sendResponse(res, 200, true, 'Translation successful', {
      originalText: text,
      translatedText,
      sourceLang: sourceLang || 'auto',
      targetLang,
    });
  } catch (error) {
    console.error('Translate error:', error);
    return sendError(res, 500, error.message);
  }
};

// Translate batch
exports.translateBatch = async (req, res) => {
  try {
    const { texts, targetLang } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return sendError(res, 400, 'Array of texts is required');
    }

    if (!targetLang) {
      return sendError(res, 400, 'Target language is required');
    }

    const translations = await translationService.translateBatch(texts, targetLang);

    return sendResponse(res, 200, true, 'Batch translation successful', {
      translations,
      targetLang,
    });
  } catch (error) {
    console.error('Batch translate error:', error);
    return sendError(res, 500, error.message);
  }
};

// Translate article
exports.translateArticle = async (req, res) => {
  try {
    const { article, targetLang } = req.body;

    if (!article) {
      return sendError(res, 400, 'Article is required');
    }

    if (!targetLang) {
      return sendError(res, 400, 'Target language is required');
    }

    const translatedArticle = await translationService.translateArticle(article, targetLang);

    return sendResponse(res, 200, true, 'Article translation successful', {
      translatedArticle,
      targetLang,
    });
  } catch (error) {
    console.error('Translate article error:', error);
    return sendError(res, 500, error.message);
  }
};

// Detect language
exports.detectLanguage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return sendError(res, 400, 'Text is required');
    }

    const language = await translationService.detectLanguage(text);

    return sendResponse(res, 200, true, 'Language detection successful', {
      language,
      text,
    });
  } catch (error) {
    console.error('Detect language error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get translation status
exports.getTranslationStatus = async (req, res) => {
  try {
    const { text, targetLang } = req.query;

    if (!text) {
      return sendError(res, 400, 'Text is required');
    }

    if (!targetLang) {
      return sendError(res, 400, 'Target language is required');
    }

    const status = await translationService.getTranslationStatus(text, targetLang);

    return sendResponse(res, 200, true, 'Translation status fetched successfully', status);
  } catch (error) {
    console.error('Get translation status error:', error);
    return sendError(res, 500, error.message);
  }
};