import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebase.config';
import { collection, getDocs, query, orderBy, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResourcesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Teaching', 'Forms', 'Guides', 'Books', 'Audio', 'Video', 'Links'];

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [searchQuery, selectedCategory, resources]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const resourcesList = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        resourcesList.push({ 
          id: doc.id, 
          ...data,
        });
      });
      
      setResources(resourcesList);
      setFilteredResources(resourcesList);
    } catch (error) {
      console.error('Error loading resources:', error);
      // Use fallback data on error
      setResources(getFallbackResources());
      setFilteredResources(getFallbackResources());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackResources = () => [
    {
      id: '1',
      title: 'Bible Study Guide - Genesis',
      type: 'pdf',
      category: 'Teaching',
      description: 'Comprehensive study guide for the book of Genesis',
      url: 'https://example.com/genesis-guide.pdf',
      downloads: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Membership Application Form',
      type: 'pdf',
      category: 'Forms',
      description: 'Download the membership application form',
      url: 'https://example.com/membership-form.pdf',
      downloads: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Prayer Guide',
      type: 'pdf',
      category: 'Guides',
      description: 'How to pray effectively - a practical guide',
      url: 'https://example.com/prayer-guide.pdf',
      downloads: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      title: 'Recommended Reading List',
      type: 'book',
      category: 'Books',
      description: 'Essential books for spiritual growth',
      url: 'https://example.com/books',
      downloads: 0,
      createdAt: new Date().toISOString(),
    },
  ];

  const filterResources = () => {
    let filtered = [...resources];

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((resource) => resource.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((resource) =>
        resource.title?.toLowerCase().includes(searchLower) ||
        resource.description?.toLowerCase().includes(searchLower) ||
        resource.category?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredResources(filtered);
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf':
        return 'document-text';
      case 'audio':
        return 'headset';
      case 'video':
        return 'videocam';
      case 'book':
        return 'book';
      case 'link':
        return 'link';
      default:
        return 'document';
    }
  };

  const getResourceColor = (type) => {
    switch (type) {
      case 'pdf':
        return '#ef4444';
      case 'audio':
        return '#8b5cf6';
      case 'video':
        return '#6366f1';
      case 'book':
        return '#10b981';
      case 'link':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  const handleResourcePress = async (resource) => {
    if (!resource.url) {
      if (Platform.OS === 'web') {
        window.alert('This resource does not have a link.');
      } else {
        Alert.alert('No URL Available', 'This resource does not have a link.');
      }
      return;
    }

    try {
      // Track download/access
      await trackResourceAccess(resource.id);

      // Open URL - use window.open for web, Linking for mobile
      if (Platform.OS === 'web') {
        // For web, use window.open which works reliably
        window.open(resource.url, '_blank', 'noopener,noreferrer');
      } else {
        // For mobile, use Linking API
        const supported = await Linking.canOpenURL(resource.url);
        if (supported) {
          await Linking.openURL(resource.url);
        } else {
          Alert.alert('Error', 'Cannot open this URL. Please check the link.');
        }
      }
    } catch (error) {
      console.error('Error opening resource:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to open resource. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to open resource. Please try again.');
      }
    }
  };

  const trackResourceAccess = async (resourceId) => {
    if (!auth.currentUser) return;

    try {
      const resourceRef = doc(db, 'resources', resourceId);
      await updateDoc(resourceRef, {
        downloads: increment(1),
        lastAccessed: new Date().toISOString(),
      });

      // Also track user's access in a separate collection (optional)
      const userAccessRef = doc(db, 'resourceAccess', `${auth.currentUser.uid}_${resourceId}`);
      const userAccessDoc = await getDoc(userAccessRef);
      if (!userAccessDoc.exists()) {
        // First time access - could add to a "userDownloads" collection if needed
      }
    } catch (error) {
      console.error('Error tracking resource access:', error);
      // Don't show error to user, just log it
    }
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Resources</Text>
          <Text style={styles.headerSubtitle}>Library & Downloads</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextSelected,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading resources...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          showsVerticalScrollIndicator={false}
        >
          {filteredResources.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No Resources Found' : 'No Resources Available'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery 
                  ? 'Try adjusting your search terms or category filter' 
                  : 'Resources will appear here once they are added'}
              </Text>
            </View>
          ) : (
            filteredResources.map((resource) => {
              const iconName = getResourceIcon(resource.type);
              const iconColor = getResourceColor(resource.type);

              return (
                <TouchableOpacity
                  key={resource.id}
                  style={styles.resourceCard}
                  onPress={() => handleResourcePress(resource)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
                    <Ionicons name={iconName} size={28} color={iconColor} />
                  </View>
                  <View style={styles.resourceInfo}>
                    <View style={styles.resourceHeader}>
                      <Text style={styles.resourceTitle} numberOfLines={2}>
                        {resource.title || 'Untitled Resource'}
                      </Text>
                      {resource.category && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{resource.category}</Text>
                        </View>
                      )}
                    </View>
                    {resource.description && (
                      <Text style={styles.resourceDescription} numberOfLines={2}>
                        {resource.description}
                      </Text>
                    )}
                    <View style={styles.resourceMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="download-outline" size={14} color="#9ca3af" />
                        <Text style={styles.metaText}>
                          {resource.downloads || 0} {resource.downloads === 1 ? 'download' : 'downloads'}
                        </Text>
                      </View>
                      {resource.type && (
                        <View style={styles.metaItem}>
                          <Ionicons name={iconName} size={14} color={iconColor} />
                          <Text style={[styles.metaText, { color: iconColor, textTransform: 'uppercase' }]}>
                            {resource.type}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 20 }} />
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  categoriesContainer: {
    maxHeight: 60,
    marginBottom: 10,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366f1',
  },
  resourceDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

