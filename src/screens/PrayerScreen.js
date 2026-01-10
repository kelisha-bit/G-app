import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../firebase.config';
import { generatePrayerSuggestion, suggestBibleVerses } from '../utils/aiService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrayerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState('Submit');
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('All'); // All, My Requests, Most Prayed
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [prayedRequests, setPrayedRequests] = useState(new Set());
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestedVerses, setSuggestedVerses] = useState([]);
  const [loadingVerses, setLoadingVerses] = useState(false);

  useEffect(() => {
    if (selectedTab === 'Requests') {
      loadPrayerRequests();
    }
  }, [selectedTab, filter]);

  const loadPrayerRequests = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let q;
      if (filter === 'My Requests') {
        q = query(
          collection(db, 'prayerRequests'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
      } else if (filter === 'Most Prayed') {
        q = query(
          collection(db, 'prayerRequests'),
          orderBy('prayers', 'desc')
        );
      } else {
        q = query(
          collection(db, 'prayerRequests'),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const requests = [];
      const prayedSet = new Set();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const prayerData = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        };

        // Check if user has prayed for this request
        if (data.prayedBy && Array.isArray(data.prayedBy) && data.prayedBy.includes(user.uid)) {
          prayedSet.add(docSnap.id);
        }

        requests.push(prayerData);
      });

      setPrayerRequests(requests);
      setPrayedRequests(prayedSet);
    } catch (error) {
      console.error('Error loading prayer requests:', error);
      Alert.alert('Error', 'Failed to load prayer requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPrayerRequests();
  };

  const handleAISuggestion = async () => {
    if (!prayerRequest.trim() && !prayerTitle.trim()) {
      Alert.alert('Info', 'Please enter some text first to get AI suggestions');
      return;
    }

    try {
      setLoadingSuggestion(true);
      const input = prayerRequest.trim() || prayerTitle.trim();
      const result = await generatePrayerSuggestion(input, prayerTitle.trim());

      if (result.error) {
        Alert.alert('Info', result.error);
      } else if (result.suggestion) {
        setPrayerRequest(result.suggestion);
        Alert.alert('Success', 'AI suggestion applied! You can edit it as needed.');
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      Alert.alert('Info', 'AI suggestion unavailable. Please write your prayer request manually.');
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleSuggestVerses = async () => {
    if (!prayerTitle.trim() && !prayerRequest.trim()) {
      Alert.alert('Info', 'Please enter a prayer topic or request first');
      return;
    }

    try {
      setLoadingVerses(true);
      const topic = prayerTitle.trim() || 'prayer';
      const situation = prayerRequest.trim();
      const result = await suggestBibleVerses(topic, situation);

      if (result.verses && result.verses.length > 0) {
        setSuggestedVerses(result.verses);
      } else {
        Alert.alert('Info', 'No verses found for this topic');
      }
    } catch (error) {
      console.error('Error getting verse suggestions:', error);
    } finally {
      setLoadingVerses(false);
    }
  };

  const handleSubmitPrayer = async () => {
    if (!prayerTitle.trim() || !prayerRequest.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'prayerRequests'), {
        title: prayerTitle.trim(),
        request: prayerRequest.trim(),
        author: isAnonymous ? 'Anonymous' : user.displayName || 'User',
        userId: user.uid,
        isAnonymous,
        prayers: 0,
        prayedBy: [],
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Your prayer request has been submitted', [
        {
          text: 'OK',
          onPress: () => {
            setPrayerTitle('');
            setPrayerRequest('');
            setIsAnonymous(false);
            setSelectedTab('Requests');
            loadPrayerRequests();
          },
        },
      ]);
    } catch (error) {
      console.error('Error submitting prayer:', error);
      Alert.alert('Error', 'Failed to submit prayer request');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePray = async (prayerId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const prayerRef = doc(db, 'prayerRequests', prayerId);
      const prayer = prayerRequests.find((p) => p.id === prayerId);

      if (!prayer) return;

      const hasPrayed = prayedRequests.has(prayerId);

      if (hasPrayed) {
        // Remove prayer
        await updateDoc(prayerRef, {
          prayers: Math.max(0, (prayer.prayers || 0) - 1),
          prayedBy: arrayRemove(user.uid),
        });
        setPrayedRequests((prev) => {
          const newSet = new Set(prev);
          newSet.delete(prayerId);
          return newSet;
        });
      } else {
        // Add prayer
        await updateDoc(prayerRef, {
          prayers: (prayer.prayers || 0) + 1,
          prayedBy: arrayUnion(user.uid),
        });
        setPrayedRequests((prev) => new Set(prev).add(prayerId));
      }

      // Reload to get updated counts
      loadPrayerRequests();
    } catch (error) {
      console.error('Error updating prayer:', error);
      Alert.alert('Error', 'Failed to update prayer count');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Recently';
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const filteredRequests = prayerRequests.filter((prayer) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      prayer.title?.toLowerCase().includes(query) ||
      prayer.request?.toLowerCase().includes(query) ||
      prayer.author?.toLowerCase().includes(query)
    );
  });

  const openDetailModal = (prayer) => {
    setSelectedPrayer(prayer);
    setDetailModalVisible(true);
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
        <Text style={styles.headerTitle}>Prayer</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'Submit' && styles.tabSelected]}
          onPress={() => setSelectedTab('Submit')}
        >
          <Text
            style={[styles.tabText, selectedTab === 'Submit' && styles.tabTextSelected]}
          >
            Submit Request
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'Requests' && styles.tabSelected]}
          onPress={() => setSelectedTab('Requests')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'Requests' && styles.tabTextSelected,
            ]}
          >
            Prayer Requests
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
        >
          {selectedTab === 'Submit' ? (
            <View>
              <View style={styles.infoCard}>
                <Ionicons name="hand-left" size={32} color="#8b5cf6" />
                <Text style={styles.infoTitle}>We're Praying With You</Text>
                <Text style={styles.infoText}>
                  Submit your prayer request and our prayer team will intercede on your
                  behalf
                </Text>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.label}>Prayer Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Healing, Job, Family..."
                  placeholderTextColor="#9ca3af"
                  value={prayerTitle}
                  onChangeText={setPrayerTitle}
                />

                <View style={styles.labelRow}>
                  <Text style={styles.label}>Prayer Request</Text>
                  <TouchableOpacity
                    style={[styles.aiButton, loadingSuggestion && styles.aiButtonDisabled]}
                    onPress={handleAISuggestion}
                    disabled={loadingSuggestion}
                  >
                    {loadingSuggestion ? (
                      <ActivityIndicator size="small" color="#6366f1" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={16} color="#6366f1" />
                        <Text style={styles.aiButtonText}>AI Help</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Share your prayer request... (or use AI Help to get suggestions)"
                  placeholderTextColor="#9ca3af"
                  value={prayerRequest}
                  onChangeText={setPrayerRequest}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />

              {/* Suggested Bible Verses */}
              {suggestedVerses.length > 0 && (
                <View style={styles.versesContainer}>
                  <Text style={styles.versesTitle}>Suggested Bible Verses</Text>
                  {suggestedVerses.map((verse, index) => (
                    <View key={index} style={styles.verseItem}>
                      <Ionicons name="book" size={16} color="#6366f1" />
                      <View style={styles.verseContent}>
                        <Text style={styles.verseReference}>{verse.reference}</Text>
                        {verse.explanation && (
                          <Text style={styles.verseExplanation}>{verse.explanation}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Suggest Verses Button */}
              <TouchableOpacity
                style={styles.suggestVersesButton}
                onPress={handleSuggestVerses}
                disabled={loadingVerses}
              >
                {loadingVerses ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <>
                    <Ionicons name="book-outline" size={18} color="#6366f1" />
                    <Text style={styles.suggestVersesText}>Get Bible Verse Suggestions</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.anonymousOption}
                onPress={() => setIsAnonymous(!isAnonymous)}
              >
                <View
                  style={[
                    styles.checkbox,
                    isAnonymous && styles.checkboxSelected,
                  ]}
                >
                  {isAnonymous && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.anonymousText}>Submit anonymously</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitPrayer}
                disabled={submitting}
              >
                <LinearGradient
                  colors={submitting ? ['#9ca3af', '#9ca3af'] : ['#6366f1', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Submit Request</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search prayer requests..."
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

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              {['All', 'My Requests', 'Most Prayed'].map((filterOption) => (
                <TouchableOpacity
                  key={filterOption}
                  style={[
                    styles.filterButton,
                    filter === filterOption && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilter(filterOption)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filter === filterOption && styles.filterButtonTextActive,
                    ]}
                  >
                    {filterOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Prayer Requests List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading prayer requests...</Text>
              </View>
            ) : filteredRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'No prayer requests match your search'
                    : filter === 'My Requests'
                    ? "You haven't submitted any prayer requests yet"
                    : 'No prayer requests yet'}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  {filteredRequests.length} Prayer Request{filteredRequests.length !== 1 ? 's' : ''}
                </Text>
                {filteredRequests.map((prayer) => {
                  const hasPrayed = prayedRequests.has(prayer.id);
                  return (
                    <TouchableOpacity
                      key={prayer.id}
                      style={styles.prayerCard}
                      onPress={() => openDetailModal(prayer)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.prayerHeader}>
                        <View style={styles.prayerHeaderLeft}>
                          <View style={styles.prayerIconContainer}>
                            <Ionicons name="heart" size={20} color="#8b5cf6" />
                          </View>
                          <View style={styles.prayerHeaderText}>
                            <Text style={styles.prayerTitle}>{prayer.title}</Text>
                            <Text style={styles.prayerAuthor}>
                              {prayer.author} • {formatDate(prayer.createdAt)}
                            </Text>
                          </View>
                        </View>
                        {prayer.userId === auth.currentUser?.uid && (
                          <View style={styles.myRequestBadge}>
                            <Text style={styles.myRequestBadgeText}>My Request</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.prayerText} numberOfLines={3}>
                        {prayer.request}
                      </Text>
                      <View style={styles.prayerFooter}>
                        <TouchableOpacity
                          style={[styles.prayButton, hasPrayed && styles.prayButtonActive]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handlePray(prayer.id);
                          }}
                        >
                          <Ionicons
                            name={hasPrayed ? 'hand-left' : 'hand-left-outline'}
                            size={18}
                            color={hasPrayed ? '#fff' : '#6366f1'}
                          />
                          <Text
                            style={[
                              styles.prayButtonText,
                              hasPrayed && styles.prayButtonTextActive,
                            ]}
                          >
                            {prayer.prayers || 0} praying
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            openDetailModal(prayer);
                          }}
                        >
                          <Text style={styles.readMore}>Read more</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>
        )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Prayer Request</Text>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            {selectedPrayer && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalPrayerHeader}>
                  <View style={styles.modalPrayerIconContainer}>
                    <Ionicons name="heart" size={24} color="#8b5cf6" />
                  </View>
                  <View style={styles.modalPrayerHeaderText}>
                    <Text style={styles.modalPrayerTitle}>{selectedPrayer.title}</Text>
                    <Text style={styles.modalPrayerAuthor}>
                      {selectedPrayer.author} • {formatDate(selectedPrayer.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.modalPrayerText}>{selectedPrayer.request}</Text>
                <View style={styles.modalPrayerFooter}>
                  <TouchableOpacity
                    style={[
                      styles.modalPrayButton,
                      prayedRequests.has(selectedPrayer.id) && styles.modalPrayButtonActive,
                    ]}
                    onPress={() => {
                      handlePray(selectedPrayer.id);
                    }}
                  >
                    <Ionicons
                      name={
                        prayedRequests.has(selectedPrayer.id)
                          ? 'hand-left'
                          : 'hand-left-outline'
                      }
                      size={20}
                      color={
                        prayedRequests.has(selectedPrayer.id) ? '#fff' : '#6366f1'
                      }
                    />
                    <Text
                      style={[
                        styles.modalPrayButtonText,
                        prayedRequests.has(selectedPrayer.id) &&
                          styles.modalPrayButtonTextActive,
                      ]}
                    >
                      {selectedPrayer.prayers || 0} people praying
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  tabSelected: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 15,
    color: '#9ca3af',
    fontWeight: '600',
  },
  tabTextSelected: {
    color: '#6366f1',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 20,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  anonymousText: {
    fontSize: 14,
    color: '#4b5563',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  prayerCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  prayerHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  prayerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prayerHeaderText: {
    flex: 1,
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  prayerAuthor: {
    fontSize: 12,
    color: '#9ca3af',
  },
  myRequestBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  myRequestBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563eb',
  },
  prayerText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  prayerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  prayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
  },
  prayButtonActive: {
    backgroundColor: '#6366f1',
  },
  prayButtonText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 6,
  },
  prayButtonTextActive: {
    color: '#fff',
  },
  readMore: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalPrayerHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalPrayerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalPrayerHeaderText: {
    flex: 1,
  },
  modalPrayerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  modalPrayerAuthor: {
    fontSize: 14,
    color: '#9ca3af',
  },
  modalPrayerText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 25,
  },
  modalPrayerFooter: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  modalPrayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
  },
  modalPrayButtonActive: {
    backgroundColor: '#6366f1',
  },
  modalPrayButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalPrayButtonTextActive: {
    color: '#fff',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  aiButtonDisabled: {
    opacity: 0.6,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  versesContainer: {
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  versesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  verseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  verseContent: {
    flex: 1,
    marginLeft: 10,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 2,
  },
  verseExplanation: {
    fontSize: 12,
    color: '#6b7280',
  },
  suggestVersesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  suggestVersesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
});

