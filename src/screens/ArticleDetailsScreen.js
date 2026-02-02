import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../firebase.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { WebView } from 'react-native-webview'; // Optional: Install react-native-webview for HTML rendering

const { width } = Dimensions.get('window');

export default function ArticleDetailsScreen({ route, navigation }) {
  const { articleId } = route.params;
  const insets = useSafeAreaInsets();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadArticle();
    loadUserData();
  }, [articleId]);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setIsAdmin(data.role === 'admin' || data.isAdmin === true);
          
          // Check if user liked this article
          if (article && article.likes && article.likes.includes(user.uid)) {
            setIsLiked(true);
          }
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading user data:', error);
    }
  };

  const loadArticle = async () => {
    try {
      setLoading(true);
      const articleDoc = await getDoc(doc(db, 'newsArticles', articleId));
      
      if (articleDoc.exists()) {
        const data = articleDoc.data();
        const articleData = {
          id: articleDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        };
        setArticle(articleData);
        
        // Check if user liked this article
        const user = auth.currentUser;
        if (user && articleData.likes && articleData.likes.includes(user.uid)) {
          setIsLiked(true);
        }
      } else {
        Alert.alert('Error', 'Article not found');
        navigation.goBack();
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading article:', error);
      Alert.alert('Error', 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to like articles');
        return;
      }

      const articleRef = doc(db, 'newsArticles', articleId);
      const newIsLiked = !isLiked;

      if (newIsLiked) {
        await updateDoc(articleRef, {
          likes: arrayUnion(user.uid),
          likesCount: (article.likesCount || 0) + 1,
        });
        setIsLiked(true);
        setArticle({ ...article, likesCount: (article.likesCount || 0) + 1 });
      } else {
        await updateDoc(articleRef, {
          likes: arrayRemove(user.uid),
          likesCount: Math.max((article.likesCount || 0) - 1, 0),
        });
        setIsLiked(false);
        setArticle({ ...article, likesCount: Math.max((article.likesCount || 0) - 1, 0) });
      }
    } catch (error) {
      if (__DEV__) console.error('Error toggling like:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${article.title}\n\n${article.excerpt || ''}\n\nRead more in the app!`,
        title: article.title,
      });
    } catch (error) {
      if (__DEV__) console.error('Error sharing:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    } else {
      d = new Date(date);
      if (isNaN(d.getTime())) return '';
    }
    return d.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      Updates: '#6366f1',
      Events: '#f59e0b',
      Ministry: '#10b981',
      Sermons: '#8b5cf6',
      Community: '#ec4899',
      Other: '#6b7280',
    };
    return colors[category] || '#6366f1';
  };

  const renderRichContent = () => {
    if (!article.content) return null;
    
    // For now, render as plain text
    // TODO: Add HTML rendering support with react-native-webview if needed
    // if (article.contentType === 'html') {
    //   return (
    //     <WebView
    //       source={{ html: article.content }}
    //       style={styles.webView}
    //       scrollEnabled={false}
    //       showsVerticalScrollIndicator={false}
    //     />
    //   );
    // }
    
    // Render as plain text with basic formatting
    return (
      <Text style={styles.contentText}>{article.content}</Text>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </View>
    );
  }

  if (!article) {
    return null;
  }

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
        <Text style={styles.headerTitle}>Article</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Featured Image */}
        {article.imageUrl && (
          <Image source={{ uri: article.imageUrl }} style={styles.featuredImage} />
        )}

        {/* Article Header */}
        <View style={styles.articleHeader}>
          {article.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
          {article.category && (
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(article.category) + '20' }]}>
              <Text style={[styles.categoryText, { color: getCategoryColor(article.category) }]}>
                {article.category}
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{article.title}</Text>

        {/* Meta Info */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
            <Text style={styles.metaText}>{formatDate(article.createdAt)}</Text>
          </View>
          {article.author && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={16} color="#9ca3af" />
              <Text style={styles.metaText}>{article.author}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {article.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Content */}
        <View style={styles.contentContainer}>
          {renderRichContent()}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, isLiked && styles.actionButtonActive]}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#ef4444' : '#6b7280'}
            />
            <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>
              {article.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={24} color="#6b7280" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  shareButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  featuredImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f3f4f6',
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featuredBadgeText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    marginTop: 16,
    lineHeight: 36,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  tagText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  webView: {
    width: width - 32,
    height: 500,
    backgroundColor: 'transparent',
  },
  contentText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 26,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  actionButtonActive: {
    backgroundColor: '#fef2f2',
  },
  actionText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  actionTextLiked: {
    color: '#ef4444',
  },
});

