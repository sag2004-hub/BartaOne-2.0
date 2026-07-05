import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NewsCard from '../../components/NewsCard';
import ChannelCard from '../../components/ChannelCard';
import EmptyState from '../../components/EmptyState';
import { searchContent } from '../../services/api';

export default function Search({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState('all'); // all, articles, channels
  const [recentSearches, setRecentSearches] = useState([
    'Local News',
    'Sports',
    'Technology',
    'Weather',
  ]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    Keyboard.dismiss();
    try {
      const results = await searchContent(searchQuery, searchType);
      setSearchResults(results);
      // Add to recent searches
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches([searchQuery, ...recentSearches.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderSearchTypes = () => (
    <View style={styles.typeContainer}>
      {['all', 'articles', 'channels'].map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.typeButton,
            searchType === type && styles.typeButtonActive,
          ]}
          onPress={() => {
            setSearchType(type);
            if (searchQuery) handleSearch();
          }}
        >
          <Text
            style={[
              styles.typeText,
              searchType === type && styles.typeTextActive,
            ]}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRecentSearches = () => (
    <View style={styles.recentContainer}>
      <Text style={styles.recentTitle}>Recent Searches</Text>
      {recentSearches.map((item) => (
        <TouchableOpacity
          key={item}
          style={styles.recentItem}
          onPress={() => {
            setSearchQuery(item);
            setTimeout(() => handleSearch(), 100);
          }}
        >
          <Ionicons name="time-outline" size={18} color="#888" />
          <Text style={styles.recentText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderResults = () => {
    if (searchResults.length === 0 && searchQuery) {
      return (
        <EmptyState
          icon="search-outline"
          title="No Results Found"
          message={`We couldn't find anything for "${searchQuery}"`}
        />
      );
    }

    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          if (item.type === 'article') {
            return (
              <NewsCard
                article={item}
                onPress={() => navigation.navigate('ArticleDetails', { articleId: item._id })}
              />
            );
          } else if (item.type === 'channel') {
            return (
              <ChannelCard
                channel={item}
                onPress={() => navigation.navigate('ChannelDetails', { channelId: item._id })}
              />
            );
          }
          return null;
        }}
        contentContainerStyle={styles.resultsList}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search news, channels..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <>
          {searchResults.length > 0 && renderSearchTypes()}
          {searchResults.length > 0 ? (
            renderResults()
          ) : (
            !searchQuery && renderRecentSearches()
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  typeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  typeButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  typeTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  recentContainer: {
    padding: 20,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  recentText: {
    fontSize: 15,
    color: '#555',
  },
  resultsList: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
});