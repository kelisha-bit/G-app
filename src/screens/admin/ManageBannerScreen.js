import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, storage, auth } from '../../../firebase.config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Video player component for banner preview
function BannerVideoPlayer({ uri, style }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function ManageBannerScreen({ navigation }) {
  const [bannerImageUrl, setBannerImageUrl] = useState(null);
  const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadBannerImage();
  }, []);

  const checkAdminStatus = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.role === 'admin');
          if (userData.role !== 'admin') {
            Alert.alert('Access Denied', 'Only administrators can manage the banner image.');
            navigation.goBack();
          }
        } else {
          Alert.alert('Access Denied', 'Only administrators can manage the banner image.');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      Alert.alert('Error', 'Failed to verify admin status.');
      navigation.goBack();
    }
  };

  const loadBannerImage = async () => {
    try {
      setLoading(true);
      const settingsDoc = await getDoc(doc(db, 'settings', 'homeBanner'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setBannerImageUrl(data.imageUrl || null);
        setMediaType(data.mediaType || 'image');
      } else {
        setBannerImageUrl(null);
        setMediaType('image');
      }
    } catch (error) {
      console.error('Error loading banner media:', error);
      Alert.alert('Error', 'Failed to load banner media');
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

      // Launch media picker (images and videos)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [16, 9], // Banner media is typically wider
        quality: 0.8,
        videoMaxDuration: 30, // Limit video to 30 seconds for banner
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        if (asset.type === 'video') {
          uploadVideo(asset.uri);
        } else {
          uploadImage(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri) => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can upload banner media.');
      return;
    }

    try {
      setUploading(true);
      
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create unique filename
      const timestamp = Date.now();
      const filename = `banner/homeBanner_${timestamp}.jpg`;
      const storageRef = ref(storage, filename);

      // Delete old banner media if exists
      if (bannerImageUrl) {
        try {
          // Extract the path from the URL
          const oldUrl = bannerImageUrl;
          if (oldUrl.includes('/banner/')) {
            const urlParts = oldUrl.split('/banner/');
            if (urlParts.length > 1) {
              const oldPath = `banner/${urlParts[1].split('?')[0]}`;
              const oldRef = ref(storage, oldPath);
              await deleteObject(oldRef);
            }
          }
        } catch (deleteError) {
          console.log('Could not delete old banner media:', deleteError);
          // Continue even if deletion fails
        }
      }

      // Upload new image
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Save to Firestore
      await setDoc(doc(db, 'settings', 'homeBanner'), {
        imageUrl: downloadURL,
        mediaType: 'image',
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid,
      }, { merge: true });
      
      setBannerImageUrl(downloadURL);
      Alert.alert('Success', 'Banner image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.code === 'storage/unauthorized') {
        Alert.alert('Permission Denied', 'You do not have permission to upload media. Please contact an administrator.');
      } else if (error.code === 'permission-denied') {
        Alert.alert('Permission Denied', 'You do not have permission to update settings. Please contact an administrator.');
      } else {
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const uploadVideo = async (uri) => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can upload banner media.');
      return;
    }

    try {
      setUploading(true);
      
      // Convert video to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create unique filename
      const timestamp = Date.now();
      const filename = `banner/homeBanner_${timestamp}.mp4`;
      const storageRef = ref(storage, filename);

      // Delete old banner media if exists
      if (bannerImageUrl) {
        try {
          // Extract the path from the URL
          const oldUrl = bannerImageUrl;
          if (oldUrl.includes('/banner/')) {
            const urlParts = oldUrl.split('/banner/');
            if (urlParts.length > 1) {
              const oldPath = `banner/${urlParts[1].split('?')[0]}`;
              const oldRef = ref(storage, oldPath);
              await deleteObject(oldRef);
            }
          }
        } catch (deleteError) {
          console.log('Could not delete old banner media:', deleteError);
          // Continue even if deletion fails
        }
      }

      // Upload new video
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Save to Firestore
      await setDoc(doc(db, 'settings', 'homeBanner'), {
        imageUrl: downloadURL,
        mediaType: 'video',
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid,
      }, { merge: true });
      
      setBannerImageUrl(downloadURL);
      Alert.alert('Success', 'Banner video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading video:', error);
      if (error.code === 'storage/unauthorized') {
        Alert.alert('Permission Denied', 'You do not have permission to upload media. Please contact an administrator.');
      } else if (error.code === 'permission-denied') {
        Alert.alert('Permission Denied', 'You do not have permission to update settings. Please contact an administrator.');
      } else {
        Alert.alert('Error', 'Failed to upload video. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const removeBanner = async () => {
    Alert.alert(
      'Remove Banner',
      'Are you sure you want to remove the banner image? This will restore the default banner.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemoving(true);
              
              // Delete image from storage
              if (bannerImageUrl) {
                try {
                  const urlParts = bannerImageUrl.split('/banner/');
                  if (urlParts.length > 1) {
                    const imagePath = `banner/${urlParts[1].split('?')[0]}`;
                    const imageRef = ref(storage, imagePath);
                    await deleteObject(imageRef);
                  }
                } catch (deleteError) {
                  console.log('Could not delete banner image from storage:', deleteError);
                }
              }
              
              // Remove from Firestore
              await setDoc(doc(db, 'settings', 'homeBanner'), {
                imageUrl: null,
                mediaType: 'image',
                updatedAt: new Date().toISOString(),
                updatedBy: auth.currentUser.uid,
              }, { merge: true });
              
              setBannerImageUrl(null);
              setMediaType('image');
              Alert.alert('Success', 'Banner media removed successfully!');
            } catch (error) {
              console.error('Error removing banner:', error);
              Alert.alert('Error', 'Failed to remove banner image.');
            } finally {
              setRemoving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Manage Banner</Text>
            <Text style={styles.headerSubtitle}>Home Screen Hero Section</Text>
          </View>
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color="#6366f1" />
          <View style={styles.instructionsText}>
            <Text style={styles.instructionsTitle}>Banner Media Guidelines</Text>
            <Text style={styles.instructionsBody}>
              • Recommended aspect ratio: 16:9 (widescreen){'\n'}
              • Images: 1200x675px or larger, under 2MB{'\n'}
              • Videos: MP4 format, max 30 seconds, under 10MB{'\n'}
              • Formats: JPG, PNG, or MP4{'\n'}
              • The banner will appear at the top of the home screen
            </Text>
          </View>
        </View>

        {/* Current Banner Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Banner</Text>
          {loading ? (
            <View style={styles.previewContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : bannerImageUrl ? (
            <View style={styles.previewContainer}>
              {mediaType === 'video' ? (
                <BannerVideoPlayer uri={bannerImageUrl} style={styles.previewImage} />
              ) : (
                <Image 
                  source={{ uri: bannerImageUrl }} 
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={removeBanner}
                disabled={removing}
              >
                {removing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.removeButtonText}>Remove Banner</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.previewContainer}>
              <View style={styles.placeholderContainer}>
                <Ionicons name="image-outline" size={64} color="#d1d5db" />
                <Text style={styles.placeholderText}>No banner media set</Text>
                <Text style={styles.placeholderSubtext}>
                  The default gradient banner is currently displayed
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Upload Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={pickImage}
            disabled={uploading}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.uploadButtonGradient}
            >
              {uploading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.uploadButtonText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
                  <Text style={styles.uploadButtonText}>
                    {bannerImageUrl ? 'Change Banner Media' : 'Upload Banner Media'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Tip</Text>
            <Text style={styles.infoBody}>
              You can change the banner image anytime. The new image will be visible to all users immediately after upload.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  instructionsBody: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  placeholderContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    gap: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
});

