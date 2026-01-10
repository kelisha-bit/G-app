import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  Share,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../../firebase.config';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  updateDoc,
  setDoc,
  doc,
  getDoc,
  arrayUnion,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 60) / 3; // 3 columns with padding

export default function MediaGalleryScreen({ navigation }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumModalVisible, setAlbumModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('albums'); // albums, recent, favorites

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'photoAlbums'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const albumsList = [];
      querySnapshot.forEach((doc) => {
        albumsList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      // If no albums, use fallback data
      if (albumsList.length === 0) {
        setAlbums(getFallbackAlbums());
      } else {
        setAlbums(albumsList);
      }
    } catch (error) {
      console.error('Error loading albums:', error);
      setAlbums(getFallbackAlbums());
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlbums();
    setRefreshing(false);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to upload images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickAndUploadImage = async (albumId) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri, albumId);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri, albumId) => {
    try {
      setUploading(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Login Required', 'Please login to upload photos');
        return;
      }

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create unique filename
      const timestamp = Date.now();
      const filename = `gallery/${albumId}/${timestamp}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);

      // Upload image
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Add photo to album
      const photoData = {
        url: downloadURL,
        uploadedBy: user.uid,
        uploadedByName: user.displayName || 'Anonymous',
        createdAt: new Date().toISOString(),
        likes: [],
        likesCount: 0,
      };

      // Update album with new photo (create if doesn't exist)
      const albumRef = doc(db, 'photoAlbums', albumId);
      const album = albums.find(a => a.id === albumId);
      const albumDoc = await getDoc(albumRef);
      
      const existingPhotos = albumDoc.exists() 
        ? (albumDoc.data().photos || [])
        : (album?.photos || []);
      
      const updatedPhotos = [...existingPhotos, photoData];

      // Use setDoc with merge to create if doesn't exist, or update if it does
      await setDoc(albumRef, {
        name: album?.name || 'Untitled Album',
        eventName: album?.eventName || null,
        photos: updatedPhotos,
        photoCount: updatedPhotos.length,
        createdAt: albumDoc.exists() ? albumDoc.data().createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Refresh albums
      await loadAlbums();
      Alert.alert('Success', 'Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (albumId, photoIndex) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Login Required', 'Please login to like photos');
        return;
      }

      const album = albums.find(a => a.id === albumId);
      if (!album || !album.photos || !album.photos[photoIndex]) return;

      const photo = album.photos[photoIndex];
      const isLiked = photo.likes && photo.likes.includes(user.uid);

      const updatedPhotos = [...album.photos];
      if (isLiked) {
        updatedPhotos[photoIndex] = {
          ...photo,
          likes: photo.likes.filter(id => id !== user.uid),
          likesCount: (photo.likesCount || 0) - 1,
        };
      } else {
        updatedPhotos[photoIndex] = {
          ...photo,
          likes: [...(photo.likes || []), user.uid],
          likesCount: (photo.likesCount || 0) + 1,
        };
      }

      const albumRef = doc(db, 'photoAlbums', albumId);
      const albumDoc = await getDoc(albumRef);
      
      // Use setDoc with merge to handle case where album doesn't exist yet
      if (albumDoc.exists()) {
        await updateDoc(albumRef, {
          photos: updatedPhotos,
        });
      } else {
        // Album doesn't exist, create it with the updated photos
        await setDoc(albumRef, {
          name: album?.name || 'Untitled Album',
          eventName: album?.eventName || null,
          photos: updatedPhotos,
          photoCount: updatedPhotos.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await loadAlbums();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const sharePhoto = async (photo) => {
    try {
      await Share.share({
        message: `Check out this photo from ${selectedAlbum?.name || 'the gallery'}! ${photo.url}`,
        url: photo.url,
      });
    } catch (error) {
      console.error('Error sharing photo:', error);
    }
  };

  const downloadPhoto = async (photo) => {
    try {
      const supported = await Linking.canOpenURL(photo.url);
      if (supported) {
        await Linking.openURL(photo.url);
      } else {
        Alert.alert('Error', 'Cannot open photo URL');
      }
    } catch (error) {
      console.error('Error downloading photo:', error);
      Alert.alert('Error', 'Failed to open photo');
    }
  };

  const openAlbum = (album) => {
    setSelectedAlbum(album);
    setAlbumModalVisible(true);
  };

  const openImage = (photo) => {
    setSelectedImage(photo);
    setImageModalVisible(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderAlbumCard = (album) => {
    const coverPhoto = album.photos && album.photos.length > 0 ? album.photos[0].url : null;
    const photoCount = album.photoCount || album.photos?.length || 0;

    return (
      <TouchableOpacity
        key={album.id}
        style={styles.albumCard}
        onPress={() => openAlbum(album)}
        activeOpacity={0.8}
      >
        {coverPhoto ? (
          <Image source={{ uri: coverPhoto }} style={styles.albumCover} />
        ) : (
          <View style={styles.albumPlaceholder}>
            <Ionicons name="images-outline" size={40} color="#9ca3af" />
          </View>
        )}
        <View style={styles.albumOverlay}>
          <View style={styles.albumInfo}>
            <Text style={styles.albumName} numberOfLines={1}>
              {album.name}
            </Text>
            <View style={styles.albumMeta}>
              <Ionicons name="images" size={14} color="#fff" />
              <Text style={styles.albumCount}>{photoCount} photos</Text>
            </View>
          </View>
        </View>
        {album.eventName && (
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>{album.eventName}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAlbumsView = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
      ) : albums.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>No albums yet</Text>
          <Text style={styles.emptySubtext}>
            Photo albums will appear here once photos are uploaded
          </Text>
        </View>
      ) : (
        <View style={styles.albumsGrid}>
          {albums.map(album => renderAlbumCard(album))}
        </View>
      )}
    </ScrollView>
  );

  const renderRecentPhotos = () => {
    const allPhotos = [];
    albums.forEach(album => {
      if (album.photos) {
        album.photos.forEach(photo => {
          allPhotos.push({ ...photo, albumName: album.name, albumId: album.id });
        });
      }
    });

    // Sort by date (newest first)
    allPhotos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {allPhotos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="image-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No photos yet</Text>
          </View>
        ) : (
          <View style={styles.photosGrid}>
            {allPhotos.slice(0, 30).map((photo, index) => (
              <TouchableOpacity
                key={index}
                style={styles.photoThumbnail}
                onPress={() => {
                  const album = albums.find(a => a.id === photo.albumId);
                  if (album) {
                    setSelectedAlbum(album);
                    const photoIndex = album.photos?.findIndex(p => p.url === photo.url) ?? -1;
                    if (photoIndex >= 0 && album.photos) {
                      openImage(album.photos[photoIndex]);
                    }
                  }
                }}
              >
                <Image source={{ uri: photo.url }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderAlbumModal = () => {
    if (!selectedAlbum) return null;

    const photos = selectedAlbum.photos || [];
    const user = auth.currentUser;
    const isLiked = (photo) => photo.likes && photo.likes.includes(user?.uid);

    return (
      <Modal
        visible={albumModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAlbumModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>{selectedAlbum.name}</Text>
                {selectedAlbum.eventName && (
                  <Text style={styles.modalSubtitle}>{selectedAlbum.eventName}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setAlbumModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {photos.length === 0 ? (
                <View style={styles.emptyAlbum}>
                  <Ionicons name="images-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyAlbumText}>No photos in this album</Text>
                </View>
              ) : (
                <View style={styles.photosGrid}>
                  {photos.map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.photoThumbnail}
                      onPress={() => openImage(photo)}
                    >
                      <Image source={{ uri: photo.url }} style={styles.thumbnailImage} />
                      {photo.likesCount > 0 && (
                        <View style={styles.photoBadge}>
                          <Ionicons name="heart" size={12} color="#fff" />
                          <Text style={styles.photoBadgeText}>{photo.likesCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {user && (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickAndUploadImage(selectedAlbum.id)}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={20} color="#fff" />
                      <Text style={styles.uploadButtonText}>Add Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderImageModal = () => {
    if (!selectedImage || !selectedAlbum) return null;

    const user = auth.currentUser;
    const photoIndex = selectedAlbum.photos?.findIndex(p => p.url === selectedImage.url) ?? -1;
    if (photoIndex === -1) return null;
    
    const photo = selectedAlbum.photos?.[photoIndex] || selectedImage;
    const isLiked = photo?.likes && photo.likes.includes(user?.uid);

    return (
      <Modal
        visible={imageModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage.url }} style={styles.fullImage} resizeMode="contain" />
          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={() => {
                if (photoIndex >= 0) {
                  toggleLike(selectedAlbum.id, photoIndex);
                }
              }}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? '#ef4444' : '#fff'}
              />
              {photo?.likesCount > 0 && (
                <Text style={styles.imageActionText}>{photo.likesCount}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={() => sharePhoto(selectedImage)}
            >
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={() => downloadPhoto(selectedImage)}
            >
              <Ionicons name="download-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {photo?.uploadedByName && (
            <View style={styles.imageInfo}>
              <Text style={styles.imageInfoText}>
                Uploaded by {photo.uploadedByName}
              </Text>
              {photo?.createdAt && (
                <Text style={styles.imageInfoDate}>{formatDate(photo.createdAt)}</Text>
              )}
            </View>
          )}
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gallery</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'albums' && styles.tabActive]}
          onPress={() => setActiveTab('albums')}
        >
          <Ionicons
            name="albums"
            size={20}
            color={activeTab === 'albums' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[styles.tabText, activeTab === 'albums' && styles.tabTextActive]}
          >
            Albums
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <Ionicons
            name="time"
            size={20}
            color={activeTab === 'recent' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}
          >
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'albums' && renderAlbumsView()}
      {activeTab === 'recent' && renderRecentPhotos()}

      {renderAlbumModal()}
      {renderImageModal()}
    </View>
  );
}

// Fallback albums data
const getFallbackAlbums = () => [
  {
    id: 'album1',
    name: 'Sunday Service',
    eventName: 'Sunday Worship',
    photoCount: 12,
    photos: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'album2',
    name: 'Youth Conference',
    eventName: 'Youth Event',
    photoCount: 8,
    photos: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'album3',
    name: 'Prayer Meeting',
    eventName: 'Prayer Service',
    photoCount: 5,
    photos: [],
    createdAt: new Date().toISOString(),
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#ede9fe',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loader: {
    marginTop: 50,
  },
  albumsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  albumCard: {
    width: (width - 60) / 2,
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  albumCover: {
    width: '100%',
    height: '100%',
  },
  albumPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  albumInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  albumName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  albumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumCount: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  eventBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoThumbnail: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  photoBadgeText: {
    fontSize: 10,
    color: '#fff',
    marginLeft: 3,
  },
  emptyState: {
    alignItems: 'center',
    padding: 50,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyAlbum: {
    alignItems: 'center',
    padding: 40,
  },
  emptyAlbumText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: width,
  },
  imageActions: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 25,
    gap: 6,
  },
  imageActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageInfo: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imageInfoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  imageInfoDate: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 4,
  },
});

