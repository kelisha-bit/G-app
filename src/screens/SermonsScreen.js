import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebase.config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SermonsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('Recent');
  const [sermons, setSermons] = useState([]);
  const [filteredSermons, setFilteredSermons] = useState([]);
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [loading, setLoading] = useState(true);

  const tabs = ['Recent', 'Series', 'Popular'];

  useEffect(() => {
    loadSermons();
  }, []);

  useEffect(() => {
    filterSermons();
  }, [searchQuery, selectedTab, sermons, selectedSeries]);

  const loadSermons = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'sermons'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const sermonsList = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sermonsList.push({ 
          id: doc.id, 
          ...data,
          // Format date for display
          formattedDate: formatDate(data.date),
        });
      });
      
      setSermons(sermonsList);
      setFilteredSermons(sermonsList);
      
      // Extract unique series
      const seriesMap = new Map();
      sermonsList.forEach((sermon) => {
        if (sermon.series && sermon.series.trim()) {
          const seriesName = sermon.series.trim();
          if (!seriesMap.has(seriesName)) {
            seriesMap.set(seriesName, {
              title: seriesName,
              episodes: 0,
              image: sermon.image || null,
            });
          }
          seriesMap.get(seriesName).episodes++;
        }
      });
      setSeries(Array.from(seriesMap.values()));
    } catch (error) {
      console.error('Error loading sermons:', error);
      Alert.alert('Error', 'Failed to load sermons. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterSermons = () => {
    let filtered = [...sermons];

    // Apply series filter if a series is selected
    if (selectedSeries) {
      filtered = filtered.filter((sermon) => 
        sermon.series && sermon.series.trim() === selectedSeries
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((sermon) =>
        sermon.title?.toLowerCase().includes(searchLower) ||
        sermon.pastor?.toLowerCase().includes(searchLower) ||
        sermon.series?.toLowerCase().includes(searchLower) ||
        sermon.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply tab filter
    if (selectedTab === 'Popular') {
      // Sort by views (convert views to number for sorting)
      filtered.sort((a, b) => {
        const viewsA = parseViews(a.views || '0');
        const viewsB = parseViews(b.views || '0');
        return viewsB - viewsA;
      });
    } else if (selectedTab === 'Recent') {
      // Sort by date
      filtered = filtered.sort((a, b) => {
        const dateA = parseDate(a.date || a.createdAt);
        const dateB = parseDate(b.date || b.createdAt);
        return dateB - dateA;
      });
    }
    // 'Series' tab shows series cards, not individual sermons

    setFilteredSermons(filtered);
  };

  const parseDate = (dateValue) => {
    if (!dateValue) return new Date(0);
    
    try {
      // Handle Firestore Timestamp objects
      if (dateValue && typeof dateValue.toDate === 'function') {
        return dateValue.toDate();
      }
      
      // Handle date strings or numbers
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return new Date(0);
      return date;
    } catch (error) {
      return new Date(0);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
      // Handle Firestore Timestamp objects
      let date;
      if (dateString && typeof dateString.toDate === 'function') {
        date = dateString.toDate();
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const parseViews = (views) => {
    if (!views) return 0;
    const viewsStr = String(views);
    if (viewsStr.includes('K')) {
      return parseFloat(viewsStr.replace('K', '')) * 1000;
    }
    return parseInt(viewsStr) || 0;
  };

  const formatViews = (views) => {
    const num = typeof views === 'string' ? parseViews(views) : (views || 0);
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const handlePlaySermon = (sermon) => {
    // Check if sermon has media
    const url = sermon.videoUrl || sermon.audioUrl;
    
    if (!url) {
      Alert.alert('No Media Available', 'This sermon does not have a video or audio link.');
      return;
    }

    // Navigate to sermon player screen
    if (navigation) {
      navigation.navigate('SermonPlayer', { sermon });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <Text style={styles.headerTitle}>Sermons</Text>
        <Text style={styles.headerSubtitle}>Watch and listen to messages</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sermons..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabSelected]}
            onPress={() => {
              setSelectedTab(tab);
              if (tab === 'Series') {
                setSelectedSeries(null); // Clear series filter when switching to Series tab
              }
            }}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextSelected]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading sermons...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          showsVerticalScrollIndicator={false}
        >
          {selectedTab === 'Series' ? (
            <View>
              {series.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="albums-outline" size={64} color="#d1d5db" />
                  <Text style={styles.emptyText}>No Series Available</Text>
                  <Text style={styles.emptySubtext}>Series will appear here once sermons are organized into series</Text>
                </View>
              ) : (
                series.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.seriesCard}
                    onPress={() => {
                      setSelectedSeries(item.title);
                      setSelectedTab('Recent'); // Switch to Recent tab to show filtered sermons
                    }}
                    activeOpacity={0.8}
                  >
                    {item.image ? (
                      <Image 
                        source={{ uri: item.image }} 
                        style={styles.seriesImage}
                      />
                    ) : (
                      <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.seriesImage}
                      >
                        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                          <Ionicons name="videocam" size={48} color="#fff" style={{ opacity: 0.7 }} />
                        </View>
                      </LinearGradient>
                    )}
                    <View style={styles.seriesOverlay}>
                      <Text style={styles.seriesTitle}>{item.title}</Text>
                      <Text style={styles.seriesEpisodes}>{item.episodes} {item.episodes === 1 ? 'Episode' : 'Episodes'}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : (
            <View>
              {selectedSeries && (
                <View style={styles.selectedSeriesContainer}>
                  <Text style={styles.selectedSeriesText}>Series: {selectedSeries}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedSeries(null)}
                    style={styles.clearSeriesButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#6366f1" />
                    <Text style={styles.clearSeriesText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}
              {filteredSermons.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="videocam-outline" size={64} color="#d1d5db" />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No Sermons Found' : selectedSeries ? `No Sermons in "${selectedSeries}"` : 'No Sermons Available'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {searchQuery 
                      ? 'Try adjusting your search terms' 
                      : selectedSeries
                      ? 'This series does not have any sermons yet'
                      : 'Sermons will appear here once they are uploaded'}
                  </Text>
                </View>
              ) : (
                filteredSermons.map((sermon) => (
                  <TouchableOpacity 
                    key={sermon.id} 
                    style={styles.sermonCard}
                    onPress={() => handlePlaySermon(sermon)}
                    activeOpacity={0.8}
                  >
                    {sermon.image ? (
                      <Image 
                        source={{ uri: sermon.image }} 
                        style={styles.sermonImage}
                      />
                    ) : (
                      <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.sermonImage}
                      >
                        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                          <Ionicons name="videocam" size={48} color="#fff" style={{ opacity: 0.7 }} />
                        </View>
                      </LinearGradient>
                    )}
                    <View style={styles.playOverlay}>
                      <View style={styles.playButton}>
                        <Ionicons 
                          name={sermon.videoUrl ? "play" : sermon.audioUrl ? "headset" : "play"} 
                          size={24} 
                          color="#fff" 
                        />
                      </View>
                    </View>
                    {sermon.duration && (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{sermon.duration}</Text>
                      </View>
                    )}
                    {sermon.series && (
                      <View style={styles.seriesBadge}>
                        <Text style={styles.seriesBadgeText}>{sermon.series}</Text>
                      </View>
                    )}
                    <View style={styles.sermonInfo}>
                      <Text style={styles.sermonTitle}>{sermon.title || 'Untitled Sermon'}</Text>
                      <Text style={styles.sermonPastor}>{sermon.pastor || 'Speaker not specified'}</Text>
                      <View style={styles.sermonMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                          <Text style={styles.metaText}>{sermon.formattedDate || sermon.date || 'Date not available'}</Text>
                        </View>
                        {(sermon.views || sermon.views === '0') && (
                          <View style={styles.metaItem}>
                            <Ionicons name="eye-outline" size={14} color="#9ca3af" />
                            <Text style={styles.metaText}>{formatViews(sermon.views)} views</Text>
                          </View>
                        )}
                        {sermon.videoUrl && (
                          <View style={styles.metaItem}>
                            <Ionicons name="videocam" size={14} color="#6366f1" />
                            <Text style={[styles.metaText, { color: '#6366f1' }]}>Video</Text>
                          </View>
                        )}
                        {sermon.audioUrl && !sermon.videoUrl && (
                          <View style={styles.metaItem}>
                            <Ionicons name="headset" size={14} color="#6366f1" />
                            <Text style={[styles.metaText, { color: '#6366f1' }]}>Audio</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.notesButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (navigation) {
                            navigation.navigate('SermonNotes', {
                              sermonId: sermon.id,
                              sermonTitle: sermon.title,
                            });
                          }
                        }}
                      >
                        <Ionicons name="document-text" size={18} color="#6366f1" />
                        <Text style={styles.notesButtonText}>Notes</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
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
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  tabSelected: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '600',
  },
  tabTextSelected: {
    color: '#6366f1',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sermonCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sermonImage: {
    width: '100%',
    height: 200,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    top: 160,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sermonInfo: {
    padding: 15,
  },
  sermonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  sermonPastor: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  sermonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  notesButtonText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 5,
  },
  seriesCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  seriesImage: {
    width: '100%',
    height: 150,
  },
  seriesOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  seriesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  seriesEpisodes: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
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
  seriesBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  seriesBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  selectedSeriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ede9fe',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  selectedSeriesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    flex: 1,
  },
  clearSeriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearSeriesText: {
    fontSize: 12,
    color: '#6366f1',
    marginLeft: 4,
    fontWeight: '600',
  },
});

