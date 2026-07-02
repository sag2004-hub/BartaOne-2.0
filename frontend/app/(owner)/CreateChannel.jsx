import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { createChannel } from '../../services/channelService';
import Loader from '../../components/Loader';

export default function CreateChannel({ navigation }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    channelName: '',
    description: '',
    language: 'en',
    state: '',
    district: '',
    city: '',
    area: '',
    category: 'news',
  });
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [errors, setErrors] = useState({});

  const languages = [
    { label: 'English', value: 'en' },
    { label: 'Bengali', value: 'bn' },
    { label: 'Hindi', value: 'hi' },
    { label: 'Urdu', value: 'ur' },
  ];

  const categories = [
    { label: 'News', value: 'news' },
    { label: 'Entertainment', value: 'entertainment' },
    { label: 'Sports', value: 'sports' },
    { label: 'Business', value: 'business' },
    { label: 'Technology', value: 'technology' },
    { label: 'Lifestyle', value: 'lifestyle' },
    { label: 'Other', value: 'other' },
  ];

  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'logo') {
        setLogo(result.assets[0]);
      } else {
        setBanner(result.assets[0]);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.channelName.trim()) {
      newErrors.channelName = 'Channel name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!logo) {
      newErrors.logo = 'Channel logo is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const channelData = {
        ...formData,
        ownerId: user.uid,
        logo: logo,
        banner: banner,
      };
      await createChannel(channelData);
      Alert.alert(
        'Success!',
        'Your channel has been created successfully!',
        [
          {
            text: 'Go to Dashboard',
            onPress: () => navigation.replace('OwnerDashboard'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader message="Creating channel..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Channel</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          <Text style={styles.subtitle}>
            Set up your news channel to start publishing
          </Text>

          {/* Logo Upload */}
          <View style={styles.uploadSection}>
            <Text style={styles.label}>Channel Logo *</Text>
            <TouchableOpacity
              style={styles.logoUpload}
              onPress={() => pickImage('logo')}
            >
              {logo ? (
                <Image source={{ uri: logo.uri }} style={styles.logoPreview} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#888" />
                  <Text style={styles.uploadText}>Upload Logo</Text>
                  <Text style={styles.uploadSubtext}>Square image recommended</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.logo && <Text style={styles.errorText}>{errors.logo}</Text>}
          </View>

          {/* Banner Upload */}
          <View style={styles.uploadSection}>
            <Text style={styles.label}>Channel Banner</Text>
            <TouchableOpacity
              style={styles.bannerUpload}
              onPress={() => pickImage('banner')}
            >
              {banner ? (
                <Image source={{ uri: banner.uri }} style={styles.bannerPreview} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="image-outline" size={32} color="#888" />
                  <Text style={styles.uploadText}>Upload Banner</Text>
                  <Text style={styles.uploadSubtext}>16:9 image recommended</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Channel Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Channel Name *</Text>
            <TextInput
              style={[styles.input, errors.channelName && styles.inputError]}
              placeholder="Enter channel name"
              value={formData.channelName}
              onChangeText={(text) => {
                setFormData({ ...formData, channelName: text });
                setErrors({ ...errors, channelName: null });
              }}
              placeholderTextColor="#999"
            />
            {errors.channelName && (
              <Text style={styles.errorText}>{errors.channelName}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description && styles.inputError]}
              placeholder="Describe your channel"
              value={formData.description}
              onChangeText={(text) => {
                setFormData({ ...formData, description: text });
                setErrors({ ...errors, description: null });
              }}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Language */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Language</Text>
            <View style={styles.pickerContainer}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  style={[
                    styles.pickerOption,
                    formData.language === lang.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, language: lang.value })}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      formData.language === lang.value && styles.pickerTextSelected,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.pickerOption,
                    formData.category === cat.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat.value })}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      formData.category === cat.value && styles.pickerTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionLabel}>Location Information</Text>
            <Text style={styles.sectionSubtext}>
              This helps viewers find local news from your area
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={[styles.input, errors.state && styles.inputError]}
                placeholder="Enter state"
                value={formData.state}
                onChangeText={(text) => {
                  setFormData({ ...formData, state: text });
                  setErrors({ ...errors, state: null });
                }}
                placeholderTextColor="#999"
              />
              {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>District *</Text>
              <TextInput
                style={[styles.input, errors.district && styles.inputError]}
                placeholder="Enter district"
                value={formData.district}
                onChangeText={(text) => {
                  setFormData({ ...formData, district: text });
                  setErrors({ ...errors, district: null });
                }}
                placeholderTextColor="#999"
              />
              {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                placeholder="Enter city"
                value={formData.city}
                onChangeText={(text) => {
                  setFormData({ ...formData, city: text });
                  setErrors({ ...errors, city: null });
                }}
                placeholderTextColor="#999"
              />
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Area</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter area (optional)"
                value={formData.area}
                onChangeText={(text) => setFormData({ ...formData, area: text })}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Create Channel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  uploadSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  logoUpload: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerUpload: {
    width: '100%',
    height: 150,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  pickerOptionSelected: {
    backgroundColor: '#FF6B6B',
  },
  pickerText: {
    fontSize: 14,
    color: '#666',
  },
  pickerTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  locationSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});