import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translateText } from '../services/translateService';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
];

export default function LanguageSelector({
  selectedLanguage = 'en',
  onLanguageSelect,
  label = 'Select Language',
  compact = false,
  showTranslationToggle = true,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedLanguages, setTranslatedLanguages] = useState([]);
  const [showTranslated, setShowTranslated] = useState(false);

  useEffect(() => {
    // When language changes, translate language names if needed
    if (selectedLanguage && selectedLanguage !== 'en') {
      translateLanguageNames(selectedLanguage);
    } else {
      setTranslatedLanguages(languages);
      setShowTranslated(false);
    }
  }, [selectedLanguage]);

  const translateLanguageNames = async (targetLang) => {
    if (targetLang === 'en') {
      setTranslatedLanguages(languages);
      setShowTranslated(false);
      return;
    }

    setIsTranslating(true);
    try {
      // Translate only the native names
      const translated = await Promise.all(
        languages.map(async (lang) => {
          if (lang.code === targetLang) {
            // Keep native name for selected language
            return { ...lang, translatedName: lang.nativeName };
          }
          try {
            const translatedName = await translateText(lang.name, targetLang);
            return { ...lang, translatedName };
          } catch (error) {
            console.error(`Error translating ${lang.name}:`, error);
            return { ...lang, translatedName: lang.name };
          }
        })
      );
      setTranslatedLanguages(translated);
      setShowTranslated(true);
    } catch (error) {
      console.error('Error translating languages:', error);
      setTranslatedLanguages(languages);
      setShowTranslated(false);
    } finally {
      setIsTranslating(false);
    }
  };

  const getLanguageName = (code) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : 'English';
  };

  const getNativeName = (code) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.nativeName : 'English';
  };

  const getDisplayName = (lang) => {
    if (showTranslated && lang.translatedName) {
      return lang.translatedName;
    }
    return lang.nativeName;
  };

  const handleLanguageSelect = (code) => {
    onLanguageSelect(code);
    // Translate language names to the newly selected language
    if (code !== 'en') {
      translateLanguageNames(code);
    }
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, compact && styles.compact]}
        onPress={() => setModalVisible(true)}
        disabled={isTranslating}
      >
        {isTranslating ? (
          <ActivityIndicator size="small" color="#FF6B6B" />
        ) : (
          <>
            <Ionicons name="language-outline" size={20} color="#666" />
            <Text style={[styles.selectedText, compact && styles.compactText]}>
              {compact ? getNativeName(selectedLanguage) : getLanguageName(selectedLanguage)}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <View style={styles.modalActions}>
                {showTranslationToggle && selectedLanguage !== 'en' && (
                  <TouchableOpacity
                    style={styles.translateToggle}
                    onPress={() => setShowTranslated(!showTranslated)}
                  >
                    <Ionicons 
                      name={showTranslated ? 'swap-horizontal' : 'swap-horizontal-outline'} 
                      size={20} 
                      color="#FF6B6B" 
                    />
                    <Text style={styles.translateToggleText}>
                      {showTranslated ? 'Show Original' : 'Show Translated'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            {isTranslating && (
              <View style={styles.translatingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.translatingText}>Translating languages...</Text>
              </View>
            )}

            <FlatList
              data={translatedLanguages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage === item.code && styles.languageItemSelected,
                  ]}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>
                      {showTranslated && item.translatedName ? item.translatedName : item.nativeName}
                    </Text>
                    {showTranslated && item.translatedName && item.translatedName !== item.nativeName && (
                      <Text style={styles.languageOriginal}>{item.name}</Text>
                    )}
                    {!showTranslated && (
                      <Text style={styles.languageEnglish}>{item.name}</Text>
                    )}
                  </View>
                  {selectedLanguage === item.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#FF6B6B" />
                  )}
                </TouchableOpacity>
              )}
              ListFooterComponent={
                <View style={styles.footerInfo}>
                  <Text style={styles.footerText}>
                    {showTranslated 
                      ? 'Showing language names translated to ' + getNativeName(selectedLanguage)
                      : 'Showing language names in their native script'}
                  </Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectedText: {
    fontSize: 14,
    color: '#333',
    minWidth: 60,
  },
  compactText: {
    fontSize: 12,
    minWidth: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  translateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
  },
  translateToggleText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  translatingContainer: {
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  translatingText: {
    fontSize: 14,
    color: '#888',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageItemSelected: {
    backgroundColor: '#FFF5F5',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  languageOriginal: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  languageEnglish: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  footerInfo: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});