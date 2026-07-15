import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/constants';

const NewspaperPage = ({ page, channel }) => {
  if (!page) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No content available</Text>
      </View>
    );
  }

  const renderLayout = () => {
    switch (page.layout) {
      case 'split':
        return (
          <View style={styles.splitLayout}>
            {page.images && page.images.length > 0 && (
              <Image 
                source={{ uri: page.images[0] }} 
                style={styles.splitImage} 
                resizeMode="cover"
              />
            )}
            <Text style={styles.splitText}>{page.content}</Text>
          </View>
        );
      
      case 'grid':
        return (
          <View style={styles.gridLayout}>
            {page.images && page.images.length > 0 && (
              <View style={styles.gridImages}>
                {page.images.slice(0, 4).map((image, index) => (
                  <Image 
                    key={index}
                    source={{ uri: image }} 
                    style={styles.gridImage} 
                    resizeMode="cover"
                  />
                ))}
              </View>
            )}
            <Text style={styles.gridText}>{page.content}</Text>
          </View>
        );
      
      default: // 'full' layout
        return (
          <View style={styles.fullLayout}>
            {page.images && page.images.length > 0 && (
              <View style={styles.imageContainer}>
                {page.images.map((image, index) => (
                  <Image 
                    key={index}
                    source={{ uri: image }} 
                    style={styles.fullImage} 
                    resizeMode="contain"
                  />
                ))}
              </View>
            )}
            <Text style={styles.fullText}>{page.content}</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {channel && (
        <View style={styles.header}>
          <Text style={styles.channelName}>{channel.name || 'Unknown Channel'}</Text>
        </View>
      )}
      
      <View style={styles.pageNumber}>
        <Text style={styles.pageNumberText}>Page {page.pageNumber}</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderLayout()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 500,
  },
  header: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    alignItems: 'center',
  },
  channelName: {
    fontSize: SIZES.body2,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  pageNumber: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  pageNumberText: {
    color: COLORS.white,
    fontSize: SIZES.body4,
    fontWeight: 'bold',
  },
  content: {
    padding: SIZES.padding,
  },
  // Full Layout
  fullLayout: {
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    marginBottom: 16,
  },
  fullImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 8,
  },
  fullText: {
    fontSize: SIZES.body2,
    lineHeight: 24,
    color: COLORS.text,
    textAlign: 'justify',
  },
  // Split Layout
  splitLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  splitImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  splitText: {
    fontSize: SIZES.body2,
    lineHeight: 24,
    color: COLORS.text,
    textAlign: 'justify',
    flex: 1,
  },
  // Grid Layout
  gridLayout: {
    alignItems: 'center',
  },
  gridImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridImage: {
    width: '48%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  gridText: {
    fontSize: SIZES.body2,
    lineHeight: 24,
    color: COLORS.text,
    textAlign: 'justify',
  },
  emptyContainer: {
    padding: SIZES.padding,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: SIZES.body2,
    color: COLORS.gray,
  },
});

export default NewspaperPage;