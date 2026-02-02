import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth, storage } from '../../firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendCommunityFeedCommentNotification, sendCommunityFeedLikeNotification } from '../utils/notificationHelpers';

const { width } = Dimensions.get('window');

export default function TestimoniesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Post creation state
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('Healing');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postImage, setPostImage] = useState(null);
  const [postImageUri, setPostImageUri] = useState(null);
  const [submittingPost, setSubmittingPost] = useState(false);
  
  // Comment state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [viewingComments, setViewingComments] = useState(false);
  
  // User data
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const scrollRef = useRef(null);

  const categories = ['All', 'Healing', 'Provision', 'Breakthrough', 'Salvation', 'Other'];

  useEffect(() => {
    loadUserData();
    loadPosts();
    
    // Set up real-time listener
    // Query all posts and filter approved ones in memory
    const postsQuery = query(
      collection(db, 'testimonies'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        // Filter to only show approved posts (isApproved !== false)
        const postsData = snapshot.docs
          .filter(doc => {
            const data = doc.data();
            // Show posts that are approved (true, null, or undefined)
            return data.isApproved !== false;
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
          }));
        setPosts(postsData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        if (__DEV__) console.error('Error listening to posts:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.name || data.email || 'User');
          setUserPhoto(data.photoURL);
          setIsAdmin(data.role === 'admin' || data.isAdmin === true);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading user data:', error);
    }
  };

  const loadPosts = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      // Query all posts and filter approved ones in memory
      // This avoids index requirements and works with the security rules
      const q = query(
        collection(db, 'testimonies'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      // Filter to only show approved posts (isApproved !== false)
      const postsData = querySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          // Show posts that are approved (true, null, or undefined) or if user is admin
          return data.isApproved !== false;
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        }));
      setPosts(postsData);
    } catch (error) {
      if (__DEV__) console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPostImageUri(result.assets[0].uri);
        setPostImage(result.assets[0]);
      }
    } catch (error) {
      if (__DEV__) console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri) => {
    try {
      const user = auth.currentUser;
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `testimonies/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      if (__DEV__) console.error('Error uploading image:', error);
      throw error;
    }
  };

  const extractHashtags = (text) => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
  };

  const handleSubmitPost = async () => {
    if (!postContent.trim()) {
      Alert.alert('Required', 'Please enter post content');
      return;
    }

    try {
      setSubmittingPost(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to post');
        return;
      }

      let imageUrl = null;
      if (postImageUri) {
        imageUrl = await uploadImage(postImageUri);
      }

      const hashtags = extractHashtags(postContent);

      await addDoc(collection(db, 'testimonies'), {
        userId: user.uid,
        userName: isAnonymous ? 'Anonymous' : userName,
        userPhoto: isAnonymous ? null : userPhoto,
        content: postContent.trim(),
        category: postCategory,
        imageUrl: imageUrl,
        hashtags: hashtags,
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        isApproved: true, // All posts are approved by default (admins can delete if needed)
        isAnonymous: isAnonymous,
      });

      // No alert - post will appear in feed
      setPostModalVisible(false);
      setPostContent('');
      setPostCategory('Healing');
      setIsAnonymous(false);
      setPostImage(null);
      setPostImageUri(null);
    } catch (error) {
      if (__DEV__) console.error('Error submitting post:', error);
      Alert.alert('Error', 'Failed to submit post');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleLike = async (post) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to like posts');
        return;
      }

      const postRef = doc(db, 'testimonies', post.id);
      const isLiked = post.likes && post.likes.includes(user.uid);

      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid),
          likesCount: (post.likesCount || 0) - 1,
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid),
          likesCount: (post.likesCount || 0) + 1,
        });

        // Send push notification to post author (first like only, and not if liking own post)
        if (post.userId !== user.uid) {
          try {
            // Get updated post data to check if this is the first like
            const postDoc = await getDoc(postRef);
            if (postDoc.exists()) {
              const updatedPost = { 
                id: postDoc.id, 
                ...postDoc.data(),
                // Use the new likesCount after increment
                likesCount: (post.likesCount || 0) + 1,
              };
              
              // Only send notification for first like (likesCount === 1)
              if (updatedPost.likesCount === 1) {
                const notificationResult = await sendCommunityFeedLikeNotification(
                  updatedPost,
                  userName || 'Someone',
                  user.uid
                );
                
                if (__DEV__) {
                  if (notificationResult.success) {
                    console.log('âœ… Like notification sent successfully:', notificationResult);
                  } else {
                    console.warn('âš ï¸ Like notification failed:', notificationResult.error);
                    if (notificationResult.skippedUsers > 0) {
                      console.warn(`   - ${notificationResult.skippedUsers} user(s) skipped due to preferences`);
                    }
                    if (notificationResult.tokenCount === 0) {
                      console.warn('   - No push tokens found for user');
                    }
                  }
                }
              } else if (__DEV__) {
                console.log(`â„¹ï¸ Skipping like notification - not first like (count: ${updatedPost.likesCount})`);
              }
            }
          } catch (notificationError) {
            if (__DEV__) console.error('âŒ Error sending like notification:', notificationError);
            // Don't fail the like if notification fails
          }
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !selectedPost) return;

    try {
      setSubmittingComment(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to comment');
        return;
      }

      const commentData = {
        userId: user.uid,
        userName: userName,
        userPhoto: userPhoto,
        text: commentText.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'testimonies', selectedPost.id, 'comments'), commentData);

      // Update comment count
      await updateDoc(doc(db, 'testimonies', selectedPost.id), {
        commentsCount: (selectedPost.commentsCount || 0) + 1,
      });

      // Send push notification to post author (if not commenting on own post)
      if (selectedPost.userId !== user.uid) {
        try {
          const notificationResult = await sendCommunityFeedCommentNotification(
            selectedPost,
            userName || 'Someone',
            user.uid
          );
          
          if (__DEV__) {
            if (notificationResult.success) {
              console.log('âœ… Comment notification sent successfully:', notificationResult);
            } else {
              console.warn('âš ï¸ Comment notification failed:', notificationResult.error);
              if (notificationResult.skippedUsers > 0) {
                console.warn(`   - ${notificationResult.skippedUsers} user(s) skipped due to preferences`);
              }
              if (notificationResult.tokenCount === 0) {
                console.warn('   - No push tokens found for user');
              }
            }
          }
        } catch (notificationError) {
          if (__DEV__) console.error('âŒ Error sending comment notification:', notificationError);
          // Don't fail the comment if notification fails
        }
      }

      setCommentText('');
      // Comment will appear automatically via real-time listener
    } catch (error) {
      if (__DEV__) console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async (post) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'testimonies', post.id));
              // No alert needed - post will disappear from feed
            } catch (error) {
              if (__DEV__) console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const showPostMenu = (post) => {
    const user = auth.currentUser;
    const isOwner = user && post.userId === user.uid;
    
    if (!isOwner && !isAdmin) return;

    Alert.alert(
      'Post Options',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Post',
          style: 'destructive',
          onPress: () => handleDeletePost(post),
        },
      ],
      { cancelable: true }
    );
  };

  const formatDate = (date) => {
    if (!date) return '';
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    } else {
      // Fallback: try to create a Date from the value
      d = new Date(date);
      if (isNaN(d.getTime())) {
        return ''; // Invalid date
      }
    }
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderHashtags = (text) => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <Text key={index} style={styles.hashtag}>
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const filteredPosts = selectedCategory === 'All'
    ? posts.filter(p => p.isApproved !== false)
    : posts.filter(p => p.category === selectedCategory && p.isApproved !== false);

  const renderPost = (post) => {
    const user = auth.currentUser;
    const isLiked = post.likes && user && post.likes.includes(user.uid);
    const isOwner = user && post.userId === user.uid;

    return (
      <View key={post.id} style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            {post.userPhoto ? (
              <Image source={{ uri: post.userPhoto }} style={styles.userAvatar} />
            ) : (
              <LinearGradient
                colors={['#e0e7ff', '#c7d2fe']}
                style={styles.userAvatarPlaceholder}
              >
                <Ionicons name="person" size={20} color="#6366f1" />
              </LinearGradient>
            )}
            <View style={styles.postUserDetails}>
              <Text style={styles.postUserName}>
                {post.isAnonymous ? 'Anonymous' : (post.userName || 'User')}
              </Text>
              <View style={styles.postMetaRow}>
                <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
                {post.category && (
                  <>
                    <Text style={styles.postMetaDot}>â€¢</Text>
                    <View style={[styles.categoryBadgeSmall, { backgroundColor: getCategoryColor(post.category) + '20' }]}>
                      <Ionicons
                        name={getCategoryIcon(post.category)}
                        size={10}
                        color={getCategoryColor(post.category)}
                        style={styles.categoryIconSmall}
                      />
                      <Text style={[styles.categoryBadgeSmallText, { color: getCategoryColor(post.category) }]}>
                        {post.category}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
          {(isOwner || isAdmin) && (
            <TouchableOpacity
              onPress={() => showPostMenu(post)}
              style={styles.deleteButton}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.postContent}>{renderHashtags(post.content)}</Text>

        {post.imageUrl && (
          <View style={styles.postImageContainer}>
            <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
          </View>
        )}

        {post.hashtags && post.hashtags.length > 0 && (
          <View style={styles.hashtagsContainer}>
            {post.hashtags.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.hashtagChip} activeOpacity={0.7}>
                <Ionicons name="pricetag-outline" size={12} color="#6366f1" />
                <Text style={styles.hashtagChipText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.postActionButton, isLiked && styles.postActionButtonActive]}
            onPress={() => handleLike(post)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? '#ef4444' : '#6b7280'}
            />
            <Text style={[styles.postActionText, isLiked && styles.postActionTextLiked]}>
              {post.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.postActionButton}
            onPress={() => {
              setSelectedPost(post);
              setViewingComments(true);
              setCommentModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#6b7280" />
            <Text style={styles.postActionText}>{post.commentsCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.postActionButton}
            onPress={() => {
              setSelectedPost(post);
              setViewingComments(false);
              setCommentModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={22} color="#6b7280" />
            <Text style={styles.postActionText}>Comment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      Healing: '#10b981',
      Provision: '#f59e0b',
      Breakthrough: '#8b5cf6',
      Salvation: '#ef4444',
      Other: '#6366f1',
    };
    return colors[category] || '#6366f1';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Healing: 'medical-outline',
      Provision: 'gift-outline',
      Breakthrough: 'flash-outline',
      Salvation: 'heart-outline',
      Other: 'star-outline',
    };
    return icons[category] || 'star-outline';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Testimonies</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setPostModalVisible(true)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#fff', '#f3f4f6']}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={24} color="#6366f1" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && [
                  styles.categoryButtonActive,
                  { backgroundColor: getCategoryColor(category) },
                ],
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              {selectedCategory === category && (
                <Ionicons
                  name={getCategoryIcon(category)}
                  size={16}
                  color="#fff"
                  style={styles.categoryIcon}
                />
              )}
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Posts List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading testimonies...</Text>
        </View>
      ) : filteredPosts.length === 0 ? (
        <View style={styles.centerContainer}>
          <LinearGradient
            colors={['#e0e7ff', '#c7d2fe']}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="star-outline" size={48} color="#6366f1" />
          </LinearGradient>
          <Text style={styles.emptyText}>No testimonies yet</Text>
          <Text style={styles.emptySubtext}>Be the first to share how God has worked in your life!</Text>
          <TouchableOpacity
            style={styles.emptyActionButton}
            onPress={() => setPostModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.emptyActionButtonText}>Share Testimony</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.postsList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredPosts.map((post) => renderPost(post))}
        </ScrollView>
      )}

      {/* Create Post Modal */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Testimony</Text>
              <TouchableOpacity onPress={() => setPostModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categorySelect}>
                {['Healing', 'Provision', 'Breakthrough', 'Salvation', 'Other'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      postCategory === cat && styles.categoryOptionActive,
                    ]}
                    onPress={() => setPostCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        postCategory === cat && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Your Testimony *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share how God has worked in your life... Use #hashtags to tag your testimony"
                value={postContent}
                onChangeText={setPostContent}
                multiline
                numberOfLines={8}
                maxLength={2000}
              />
              <Text style={styles.charCount}>{postContent.length}/2000</Text>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setIsAnonymous(!isAnonymous)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                  {isAnonymous && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Post anonymously</Text>
              </TouchableOpacity>

              {postImageUri && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: postImageUri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setPostImage(null);
                      setPostImageUri(null);
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={20} color="#6366f1" />
                <Text style={styles.imageButtonText}>Add Photo</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setPostModalVisible(false);
                  setPostContent('');
                  setPostCategory('Healing');
                  setIsAnonymous(false);
                  setPostImage(null);
                  setPostImageUri(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submittingPost && styles.submitButtonDisabled]}
                onPress={handleSubmitPost}
                disabled={submittingPost || !postContent.trim()}
              >
                {submittingPost ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setCommentModalVisible(false);
          setSelectedPost(null);
          setCommentText('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {viewingComments ? 'Comments' : 'Add Comment'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCommentModalVisible(false);
                  setSelectedPost(null);
                  setCommentText('');
                  setViewingComments(false);
                }}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {selectedPost && (
              <>
                {viewingComments && (
                  <ScrollView style={styles.commentsList}>
                    <CommentsList postId={selectedPost.id} />
                  </ScrollView>
                )}
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write a comment..."
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[styles.sendCommentButton, submittingComment && styles.sendCommentButtonDisabled]}
                    onPress={handleComment}
                    disabled={submittingComment || !commentText.trim()}
                  >
                    {submittingComment ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="send" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// Comments List Component
function CommentsList({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'testimonies', postId, 'comments'),
        orderBy('createdAt', 'asc')
      ),
      (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        }));
        setComments(commentsData);
        setLoading(false);
      },
      (error) => {
        if (__DEV__) console.error('Error loading comments:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [postId]);

  const formatDate = (date) => {
    if (!date) return '';
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    } else {
      // Fallback: try to create a Date from the value
      d = new Date(date);
      if (isNaN(d.getTime())) {
        return ''; // Invalid date
      }
    }
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.commentsLoading}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }

  if (comments.length === 0) {
    return (
      <View style={styles.commentsEmpty}>
        <Text style={styles.commentsEmptyText}>No comments yet. Be the first to comment!</Text>
      </View>
    );
  }

  return (
    <>
      {comments.map((comment) => (
        <View key={comment.id} style={styles.commentItem}>
          <View style={styles.commentHeader}>
            {comment.userPhoto ? (
              <Image source={{ uri: comment.userPhoto }} style={styles.commentAvatar} />
            ) : (
              <View style={styles.commentAvatarPlaceholder}>
                <Ionicons name="person" size={16} color="#6366f1" />
              </View>
            )}
            <View style={styles.commentUserInfo}>
              <Text style={styles.commentUserName}>{comment.userName || 'User'}</Text>
              <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
            </View>
          </View>
          <Text style={styles.commentText}>{comment.text}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
    elevation: 3,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  emptyActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  postsList: {
    flex: 1,
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  postUserDetails: {
    flex: 1,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  postTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  postMetaDot: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  categoryBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 4,
  },
  categoryIconSmall: {
    marginRight: 4,
  },
  categoryBadgeSmallText: {
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 20,
  },
  postContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 14,
    letterSpacing: 0.1,
  },
  hashtag: {
    color: '#6366f1',
    fontWeight: '700',
  },
  postImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  postImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#f3f4f6',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    gap: 8,
  },
  hashtagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    gap: 4,
  },
  hashtagChipText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  postActions: {
    flexDirection: 'row',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 20,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  postActionButtonActive: {
    backgroundColor: '#fef2f2',
  },
  postActionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  postActionTextLiked: {
    color: '#ef4444',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categorySelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryOption: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
    elevation: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryOptionTextActive: {
    color: '#6366f1',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 16,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  commentsList: {
    maxHeight: 400,
    padding: 20,
  },
  commentsLoading: {
    padding: 20,
    alignItems: 'center',
  },
  commentsEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  commentsEmptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  commentAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  commentTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
    marginLeft: 46,
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: '#fafafa',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#fff',
  },
  sendCommentButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendCommentButtonDisabled: {
    opacity: 0.5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});

