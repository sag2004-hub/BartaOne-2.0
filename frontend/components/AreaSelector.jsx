import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Sample location data
const LOCATIONS = {
  states: [
    { id: 'dhaka', name: 'Dhaka' },
    { id: 'chittagong', name: 'Chittagong' },
    { id: 'khulna', name: 'Khulna' },
    { id: 'rajshahi', name: 'Rajshahi' },
    { id: 'sylhet', name: 'Sylhet' },
  ],
  districts: {
    dhaka: [
      { id: 'dhaka_dist', name: 'Dhaka District' },
      { id: 'gazipur', name: 'Gazipur' },
      { id: 'narayanganj', name: 'Narayanganj' },
    ],
    chittagong: [
      { id: 'chittagong_dist', name: 'Chittagong District' },
      { id: 'cox_bazar', name: 'Cox\'s Bazar' },
      { id: 'rangamati', name: 'Rangamati' },
    ],
    // ... add more districts
  },
  cities: {
    dhaka_dist: [
      { id: 'dhaka_city', name: 'Dhaka City' },
      { id: 'uttara', name: 'Uttara' },
      { id: 'gulshan', name: 'Gulshan' },
    ],
    // ... add more cities
  }
};

export default function AreaSelector({
  selectedState = null,
  selectedDistrict = null,
  selectedCity = null,
  selectedArea = null,
  onSelectState,
  onSelectDistrict,
  onSelectCity,
  onSelectArea,
  label = 'Select Location',
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState('state'); // state, district, city, area
  const [filteredItems, setFilteredItems] = useState([]);

  const getCurrentItems = () => {
    let items = [];
    switch(step) {
      case 'state':
        items = LOCATIONS.states;
        break;
      case 'district':
        if (selectedState) {
          items = LOCATIONS.districts[selectedState] || [];
        }
        break;
      case 'city':
        if (selectedDistrict) {
          items = LOCATIONS.cities[selectedDistrict] || [];
        }
        break;
      case 'area':
        items = [];
        break;
    }
    return items;
  };

  const getSelectedText = () => {
    const parts = [];
    if (selectedState) {
      const state = LOCATIONS.states.find(s => s.id === selectedState);
      if (state) parts.push(state.name);
    }
    if (selectedDistrict) {
      const district = LOCATIONS.districts[selectedState]?.find(d => d.id === selectedDistrict);
      if (district) parts.push(district.name);
    }
    if (selectedCity) {
      const city = LOCATIONS.cities[selectedDistrict]?.find(c => c.id === selectedCity);
      if (city) parts.push(city.name);
    }
    if (selectedArea) parts.push(selectedArea);
    return parts.length > 0 ? parts.join(', ') : 'Select Location';
  };

  const handleItemSelect = (item) => {
    switch(step) {
      case 'state':
        onSelectState(item.id);
        setStep('district');
        break;
      case 'district':
        onSelectDistrict(item.id);
        setStep('city');
        break;
      case 'city':
        onSelectCity(item.id);
        setStep('area');
        break;
    }
  };

  const resetSelection = () => {
    setStep('state');
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => {
          setModalVisible(true);
          resetSelection();
        }}
      >
        <Ionicons name="location-outline" size={20} color="#666" />
        <Text style={styles.selectedText} numberOfLines={1}>
          {getSelectedText()}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
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
              <View style={styles.headerLeft}>
                {step !== 'state' && (
                  <TouchableOpacity onPress={() => {
                    if (step === 'district') {
                      setStep('state');
                    } else if (step === 'city') {
                      setStep('district');
                    } else if (step === 'area') {
                      setStep('city');
                    }
                  }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.modalTitle}>
                Select {step.charAt(0).toUpperCase() + step.slice(1)}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${step}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {step === 'area' ? (
                <View style={styles.areaContainer}>
                  <TextInput
                    style={styles.areaInput}
                    placeholder="Enter your area name"
                    value={selectedArea || ''}
                    onChangeText={onSelectArea}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.confirmButtonText}>Confirm Location</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                getCurrentItems().map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.item}
                    onPress={() => handleItemSelect(item)}
                  >
                    <Text style={styles.itemText}>{item.name}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetSelection}
            >
              <Text style={styles.resetText}>Reset Selection</Text>
            </TouchableOpacity>
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
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  selectedText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
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
  headerLeft: {
    width: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  areaContainer: {
    padding: 20,
  },
  areaInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  resetText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
});