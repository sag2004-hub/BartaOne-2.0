import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/constants';

const NewspaperControls = ({ currentPage, totalPages, onPageChange }) => {
  const goToPrevious = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  const goToFirst = () => {
    onPageChange(0);
  };

  const goToLast = () => {
    onPageChange(totalPages - 1);
  };

  if (totalPages <= 1) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, currentPage === 0 && styles.buttonDisabled]}
        onPress={goToFirst}
        disabled={currentPage === 0}
      >
        <Ionicons 
          name="chevron-back" 
          size={20} 
          color={currentPage === 0 ? COLORS.gray : COLORS.primary} 
        />
        <Ionicons 
          name="chevron-back" 
          size={20} 
          color={currentPage === 0 ? COLORS.gray : COLORS.primary} 
          style={{ marginLeft: -12 }}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, currentPage === 0 && styles.buttonDisabled]}
        onPress={goToPrevious}
        disabled={currentPage === 0}
      >
        <Ionicons 
          name="chevron-back" 
          size={24} 
          color={currentPage === 0 ? COLORS.gray : COLORS.primary} 
        />
      </TouchableOpacity>

      <View style={styles.pageInfo}>
        <Text style={styles.pageText}>
          {currentPage + 1} / {totalPages}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, currentPage === totalPages - 1 && styles.buttonDisabled]}
        onPress={goToNext}
        disabled={currentPage === totalPages - 1}
      >
        <Ionicons 
          name="chevron-forward" 
          size={24} 
          color={currentPage === totalPages - 1 ? COLORS.gray : COLORS.primary} 
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, currentPage === totalPages - 1 && styles.buttonDisabled]}
        onPress={goToLast}
        disabled={currentPage === totalPages - 1}
      >
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={currentPage === totalPages - 1 ? COLORS.gray : COLORS.primary} 
        />
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={currentPage === totalPages - 1 ? COLORS.gray : COLORS.primary} 
          style={{ marginLeft: -12 }}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.lightPrimary,
    marginHorizontal: 4,
  },
  buttonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  pageInfo: {
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  pageText: {
    fontSize: SIZES.body2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});

export default NewspaperControls;