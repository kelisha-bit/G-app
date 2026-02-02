import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../../firebase.config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

export default function EditProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Refs for scrolling
  const scrollViewRef = useRef(null);
  const bioInputRef = useRef(null);

  // Profile data
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    loadUserProfile();
    
    // Keyboard listeners to handle scrolling for bio field
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        // Only handle if bio input is likely focused
        setTimeout(() => {
          if (bioInputRef.current && scrollViewRef.current) {
            bioInputRef.current.measureInWindow((x, y, width, height) => {
              const keyboardHeight = e.endCoordinates.height;
              const screenHeight = Dimensions.get('window').height;
              const inputBottom = y + height;
              const visibleAreaBottom = screenHeight - keyboardHeight;
              
              // If input would be covered by keyboard, scroll to make it visible
              if (inputBottom > visibleAreaBottom - 20) {
                const scrollOffset = inputBottom - visibleAreaBottom + 30;
                scrollViewRef.current.scrollTo({
                  y: scrollOffset,
                  animated: true,
                });
              }
            });
          }
        }, Platform.OS === 'ios' ? 100 : 50);
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setDisplayName(data.displayName || user.displayName || '');
        setPhoneNumber(data.phoneNumber || '');
        setBio(data.bio || '');
        setPhotoURL(data.photoURL || user.photoURL || null);
        setAddress(data.address || '');
        setDateOfBirth(data.dateOfBirth || '');
      } else {
        // Initialize with auth data if no Firestore document exists
        setDisplayName(user.displayName || '');
        setPhotoURL(user.photoURL || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      
      // Verify user is authenticated
      if (!user || !user.uid) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      // Convert image to blob
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      const blob = await response.blob();

      // Create storage reference - using profilePictures path to match storage rules
      const storageRef = ref(storage, `profilePictures/${user.uid}/profile.jpg`);

      // Upload image
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      setPhotoURL(downloadURL);
      
      // Update Firestore immediately with both photoURL and profilePicture fields
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const updateData = {
        photoURL: downloadURL,
        profilePicture: downloadURL, // Also save as profilePicture for DirectoryScreen
        updatedAt: new Date().toISOString(),
      };
      
      if (userDoc.exists()) {
        await updateDoc(userRef, updateData);
      } else {
        // If user document doesn't exist yet, create it with basic info
        await setDoc(userRef, {
          ...updateData,
          displayName: displayName || user.displayName || '',
          email: user.email,
          createdAt: new Date().toISOString(),
          role: 'member',
        });
      }
      
      // Also update Firebase Auth profile
      await updateProfile(user, {
        photoURL: downloadURL,
      });
      
      Alert.alert('Success', 'Profile photo uploaded successfully!');
    } catch (error) {
      if (__DEV__) console.error('Error uploading image:', error);
      let errorMessage = 'Failed to upload photo. Please try again.';
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'You do not have permission to upload photos. Please check your account permissions.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Display name is required');
      return;
    }

    try {
      setSaving(true);

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: photoURL,
      });

      // Update Firestore document
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      const profileData = {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
        photoURL: photoURL,
        profilePicture: photoURL, // Also save as profilePicture for DirectoryScreen compatibility
        address: address.trim(),
        dateOfBirth: dateOfBirth.trim(),
        email: user.email,
        updatedAt: new Date().toISOString(),
      };

      if (userDoc.exists()) {
        await updateDoc(userRef, profileData);
      } else {
        await setDoc(userRef, {
          ...profileData,
          createdAt: new Date().toISOString(),
          role: 'member',
        });
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      if (__DEV__) console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={true}
      >
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {displayName
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons name="camera" size={20} color="#6366f1" />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputContainer, styles.inputDisabled]}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                value={user?.email}
                editable={false}
                placeholderTextColor="#9ca3af"
              />
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <View 
              ref={bioInputRef}
              style={[styles.inputContainer, styles.textAreaContainer]}
              collapsable={false}
            >
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => {
                  // Trigger keyboard show event which will handle scrolling
                  setTimeout(() => {
                    if (bioInputRef.current && scrollViewRef.current) {
                      bioInputRef.current.measureInWindow((x, y, width, height) => {
                        const { height: screenHeight } = Dimensions.get('window');
                        const estimatedKeyboardHeight = Platform.OS === 'ios' ? 300 : 250;
                        const visibleAreaBottom = screenHeight - estimatedKeyboardHeight;
                        const inputBottom = y + height;
                        
                        if (inputBottom > visibleAreaBottom) {
                          const scrollOffset = inputBottom - visibleAreaBottom + 40;
                          scrollViewRef.current.scrollTo({
                            y: scrollOffset,
                            animated: true,
                          });
                        }
                      });
                    }
                  }, Platform.OS === 'ios' ? 300 : 200);
                }}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 200 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 400,
    flexGrow: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  photoPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 10,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textArea: {
    height: 100,
    marginLeft: 0,
  },
  helperText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 5,
    marginLeft: 5,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
});




