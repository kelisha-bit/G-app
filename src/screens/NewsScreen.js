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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db, auth } from '../../firebase.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function NewsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [articles, setArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAdmin, setIsAdmin] = useState(false);

  const categories = ['All', 'Updates', 'Events', 'Ministry', 'Sermons', 'Community', 'Other'];

  useEffect(() => {
    loadUserData();
    loadArticles();
    
    // Set up real-time listener
    const articlesQuery = query(
      collection(db, 'newsArticles'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      articlesQuery,
      (snapshot) => {
        const articlesData = snapshot.docs
          .filter(doc => {
            const data = doc.data();
            return data.isPublished !== false;
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
          }));
        
        // Separate featured articles
        const featured = articlesData.filter(article => article.isFeatured === true);
        const regular = articlesData.filter(article => article.isFeatured !== true);
        
        setFeaturedArticles(featured);
        setArticles(regular);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        if (__DEV__) console.error('Error listening to articles:', error);
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
          setIsAdmin(data.role === 'admin' || data.isAdmin === true);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading user data:', error);
    }
  };

  const loadArticles = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const q = query(
        collection(db, 'newsArticles'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const articlesData = querySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.isPublished !== false;
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        }));
      
      const featured = articlesData.filter(article => article.isFeatured === true);
      const regular = articlesData.filter(article => article.isFeatured !== true);
      
      setFeaturedArticles(featured);
      setArticles(regular);
    } catch (error) {
      if (__DEV__) console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadArticles();
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
      month: 'short', 
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

  const filteredArticles = selectedCategory === 'All'
    ? articles
    : articles.filter(article => article.category === selectedCategory);

  const renderFeaturedArticle = (article) => (
    <TouchableOpacity
      key={article.id}
      style={styles.featuredCard}
      onPress={() => navigation.navigate('ArticleDetails', { articleId: article.id })}
      activeOpacity={0.8}
    >
      {article.imageUrl && (
        <Image source={{ uri: article.imageUrl }} style={styles.featuredImage} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.featuredGradient}
      >
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Text style={styles.featuredBadgeText}>Featured</Text>
        </View>
        <Text style={styles.featuredTitle}>{article.title}</Text>
        <View style={styles.featuredMeta}>
          <Text style={styles.featuredDate}>{formatDate(article.createdAt)}</Text>
          {article.category && (
            <>
              <Text style={styles.featuredMetaDot}>•</Text>
              <View style={[styles.featuredCategoryBadge, { backgroundColor: getCategoryColor(article.category) + '40' }]}>
                <Text style={[styles.featuredCategoryText, { color: getCategoryColor(article.category) }]}>
                  {article.category}
                </Text>
              </View>
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderArticle = (article) => (
    <TouchableOpacity
      key={article.id}
      style={styles.articleCard}
      onPress={() => navigation.navigate('ArticleDetails', { articleId: article.id })}
      activeOpacity={0.7}
    >
      {article.imageUrl && (
        <Image source={{ uri: article.imageUrl }} style={styles.articleImage} />
      )}
      <View style={styles.articleContent}>
        <View style={styles.articleHeader}>
          {article.category && (
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(article.category) + '20' }]}>
              <Text style={[styles.categoryText, { color: getCategoryColor(article.category) }]}>
                {article.category}
              </Text>
            </View>
          )}
          <Text style={styles.articleDate}>{formatDate(article.createdAt)}</Text>
        </View>
        <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
        {article.excerpt && (
          <Text style={styles.articleExcerpt} numberOfLines={3}>{article.excerpt}</Text>
        )}
        {article.tags && article.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {article.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {article.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{article.tags.length - 3} more</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Church News</Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('ManageNews')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#fff', '#f3f4f6']}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color="#6366f1" />
            </LinearGradient>
          </TouchableOpacity>
        )}
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
                  { backgroundColor: getCategoryColor(category) || '#6366f1' },
                ],
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
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

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredContainer}>
                {featuredArticles.map(article => renderFeaturedArticle(article))}
              </ScrollView>
            </View>
          )}

          {/* Regular Articles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'All Articles' : selectedCategory}
            </Text>
            {filteredArticles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={['#e0e7ff', '#c7d2fe']}
                  style={styles.emptyIconContainer}
                >
                  <Ionicons name="newspaper-outline" size={48} color="#6366f1" />
                </LinearGradient>
                <Text style={styles.emptyText}>No articles yet</Text>
                <Text style={styles.emptySubtext}>Check back soon for church updates!</Text>
              </View>
            ) : (
              filteredArticles.map(article => renderArticle(article))
            )}
          </View>
        </ScrollView>
      )}
    </View>
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
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  featuredContainer: {
    paddingLeft: 16,
  },
  featuredCard: {
    width: width * 0.85,
    height: 280,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredDate: {
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  featuredMetaDot: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  featuredCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredCategoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  articleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  articleImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  articleContent: {
    padding: 16,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  articleDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24,
  },
  articleExcerpt: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  tagText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
});

