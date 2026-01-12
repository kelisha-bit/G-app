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
  TextInput,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, where } from 'firebase/firestore';
import { db, auth } from '../../firebase.config';

export default function SmallGroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, my-groups, available

  useEffect(() => {
    loadSmallGroups();
    loadUserGroups();
  }, []);

  const loadSmallGroups = async () => {
    try {
      setLoading(true);
      // Try with orderBy first, fallback to simple query if it fails
      let querySnapshot;
      try {
        const groupsQuery = query(
          collection(db, 'smallGroups'),
          orderBy('name', 'asc')
        );
        querySnapshot = await getDocs(groupsQuery);
      } catch (orderByError) {
        // If orderBy fails (e.g., missing index or permissions), try without it
        console.log('orderBy failed, trying without:', orderByError);
        querySnapshot = await getDocs(collection(db, 'smallGroups'));
      }
      
      if (!querySnapshot.empty) {
        const groupsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort manually if orderBy failed
        groupsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setGroups(groupsData);
      } else {
        // Use fallback data if no groups in Firestore
        setGroups(getFallbackGroups());
      }
    } catch (error) {
      console.error('Error loading small groups:', error);
      // Use fallback data on error
      setGroups(getFallbackGroups());
    } finally {
      setLoading(false);
    }
  };

  const loadUserGroups = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserGroups(userData.smallGroups || []);
      }
    } catch (error) {
      console.error('Error loading user groups:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSmallGroups();
    await loadUserGroups();
    setRefreshing(false);
  };

  const handleJoinGroup = async (group) => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please login to join a small group');
      return;
    }

    // Check if group is full
    if (group.capacity && group.memberCount >= group.capacity) {
      Alert.alert('Group Full', 'This group has reached its capacity. Please contact the leader for more information.');
      return;
    }

    // Check if already a member
    if (userGroups.includes(group.id)) {
      Alert.alert('Already a Member', 'You are already a member of this group.');
      return;
    }

    Alert.alert(
      'Join Small Group',
      `Are you sure you want to join "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
            onPress: async () => {
            try {
              const user = auth.currentUser;
              const groupRef = doc(db, 'smallGroups', group.id);
              const userRef = doc(db, 'users', user.uid);

              // Check if group document exists, create it if it doesn't (fallback groups)
              const groupDoc = await getDoc(groupRef);
              let currentMemberCount = 0;
              
              if (!groupDoc.exists()) {
                // Create the group document with initial data
                await setDoc(groupRef, {
                  name: group.name,
                  leader: group.leader || 'TBA',
                  schedule: group.schedule || 'TBA',
                  location: group.location || 'TBA',
                  topic: group.topic || '',
                  description: group.description || group.fullDescription || '',
                  image: group.image || '',
                  contact: group.contact || '',
                  capacity: group.capacity || null,
                  members: [],
                  memberCount: 0,
                  createdAt: new Date(),
                });
                currentMemberCount = 0;
              } else {
                // Get current member count from existing document
                const existingData = groupDoc.data();
                currentMemberCount = existingData.memberCount || 0;
              }

              // Add user to group
              await updateDoc(groupRef, {
                members: arrayUnion(user.uid),
                memberCount: currentMemberCount + 1,
              });

              // Add group to user
              await updateDoc(userRef, {
                smallGroups: arrayUnion(group.id),
              });

              // Update local state
              setUserGroups([...userGroups, group.id]);
              await loadSmallGroups(); // Refresh to update member count

              Alert.alert('Success', `You've joined ${group.name}!`);
            } catch (error) {
              console.error('Error joining group:', error);
              Alert.alert('Error', 'Failed to join group. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = async (group) => {
    Alert.alert(
      'Leave Small Group',
      `Are you sure you want to leave "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              const groupRef = doc(db, 'smallGroups', group.id);
              const userRef = doc(db, 'users', user.uid);

              // Check if group document exists before trying to update
              const groupDoc = await getDoc(groupRef);
              if (groupDoc.exists()) {
                // Remove user from group
                await updateDoc(groupRef, {
                  members: arrayRemove(user.uid),
                  memberCount: Math.max((group.memberCount || 1) - 1, 0),
                });
              }

              // Remove group from user (this should always work)
              await updateDoc(userRef, {
                smallGroups: arrayRemove(group.id),
              });

              // Update local state
              setUserGroups(userGroups.filter(id => id !== group.id));
              await loadSmallGroups(); // Refresh to update member count

              Alert.alert('Success', `You've left ${group.name}.`);
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openGroupDetails = (group) => {
    setSelectedGroup(group);
    setModalVisible(true);
  };

  const getFilteredGroups = () => {
    let filtered = [...groups]; // Create a copy to avoid mutating state

    // Apply search filter first
    if (searchQuery.trim()) {
      filtered = filtered.filter(group =>
        group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.leader?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filter === 'my-groups') {
      filtered = filtered.filter(group => userGroups.includes(group.id));
    } else if (filter === 'available') {
      filtered = filtered.filter(group => {
        // If no capacity set, always available
        if (!group.capacity) return true;
        // Check if current member count is less than capacity
        return (group.memberCount || 0) < group.capacity;
      });
    }
    // If filter === 'all', show all filtered groups (no additional filtering)

    return filtered;
  };

  const isMember = (groupId) => {
    return userGroups.includes(groupId);
  };

  const renderGroupCard = (group, index, total) => {
    const member = isMember(group.id);
    const isFull = group.capacity && (group.memberCount || 0) >= group.capacity;

    return (
      <TouchableOpacity
        key={group.id}
        style={[styles.groupCard, index < total - 1 && styles.groupCardMargin]}
        onPress={() => openGroupDetails(group)}
        activeOpacity={0.8}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            {member && (
              <View style={styles.memberBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={styles.memberBadgeText}>Member</Text>
              </View>
            )}
            {isFull && !member && (
              <View style={styles.fullBadge}>
                <Text style={styles.fullBadgeText}>Full</Text>
              </View>
            )}
          </View>
          {group.image && (
            <Image source={{ uri: group.image }} style={styles.groupImage} />
          )}
        </View>

        {group.topic && (
          <Text style={styles.groupTopic} numberOfLines={1}>
            📖 {group.topic}
          </Text>
        )}

        <View style={styles.groupDetails}>
          <View style={[styles.detailItem, styles.detailItemMargin]}>
            <Ionicons name="person" size={16} color="#14b8a6" />
            <Text style={styles.detailText}>{group.leader || 'TBA'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color="#10b981" />
            <Text style={styles.detailText}>{group.schedule || 'TBA'}</Text>
          </View>
        </View>

        <View style={styles.groupFooter}>
          <View style={styles.memberCount}>
            <Ionicons name="people" size={16} color="#6b7280" />
            <Text style={styles.memberCountText}>
              {group.memberCount || 0}
              {group.capacity ? ` / ${group.capacity}` : ''} members
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.actionButton,
              member && styles.leaveButton,
              isFull && !member && styles.disabledButton,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (member) {
                handleLeaveGroup(group);
              } else if (!isFull) {
                handleJoinGroup(group);
              }
            }}
            disabled={isFull && !member}
          >
            <Text style={[styles.actionButtonText, member && styles.leaveButtonText]}>
              {member ? 'Leave' : isFull ? 'Full' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupDetails = () => {
    if (!selectedGroup) return null;

    const member = isMember(selectedGroup.id);
    const isFull = selectedGroup.capacity && (selectedGroup.memberCount || 0) >= selectedGroup.capacity;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedGroup.name}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>

              {selectedGroup.image && (
                <Image source={{ uri: selectedGroup.image }} style={styles.modalImage} />
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>About This Group</Text>
                <Text style={styles.modalDescription}>
                  {selectedGroup.description || selectedGroup.fullDescription || 'No description available.'}
                </Text>
              </View>

              {selectedGroup.topic && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Current Study</Text>
                  <Text style={styles.modalText}>{selectedGroup.topic}</Text>
                </View>
              )}

              <View style={styles.modalInfoGrid}>
                <View style={styles.modalInfoCard}>
                  <Ionicons name="person" size={24} color="#14b8a6" />
                  <Text style={styles.modalInfoLabel}>Leader</Text>
                  <Text style={styles.modalInfoValue}>{selectedGroup.leader || 'TBA'}</Text>
                </View>
                <View style={styles.modalInfoCard}>
                  <Ionicons name="calendar" size={24} color="#10b981" />
                  <Text style={styles.modalInfoLabel}>Schedule</Text>
                  <Text style={styles.modalInfoValue}>{selectedGroup.schedule || 'TBA'}</Text>
                </View>
                <View style={styles.modalInfoCard}>
                  <Ionicons name="location" size={24} color="#ef4444" />
                  <Text style={styles.modalInfoLabel}>Location</Text>
                  <Text style={styles.modalInfoValue}>{selectedGroup.location || 'TBA'}</Text>
                </View>
                <View style={styles.modalInfoCard}>
                  <Ionicons name="people" size={24} color="#8b5cf6" />
                  <Text style={styles.modalInfoLabel}>Members</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedGroup.memberCount || 0}
                    {selectedGroup.capacity ? ` / ${selectedGroup.capacity}` : ''}
                  </Text>
                </View>
              </View>

              {selectedGroup.contact && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Contact</Text>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={async () => {
                      try {
                        const phoneNumber = selectedGroup.contact.replace(/[^\d+]/g, '');
                        const phoneUrl = `tel:${phoneNumber}`;
                        
                        const canOpen = await Linking.canOpenURL(phoneUrl);
                        if (canOpen) {
                          await Linking.openURL(phoneUrl);
                        } else {
                          Alert.alert(
                            'Cannot Make Call',
                            'Your device cannot make phone calls. Please use: ' + selectedGroup.contact
                          );
                        }
                      } catch (error) {
                        console.error('Error making phone call:', error);
                        Alert.alert(
                          'Error',
                          `Unable to make call. Please contact ${selectedGroup.leader} at ${selectedGroup.contact}`
                        );
                      }
                    }}
                  >
                    <Ionicons name="call" size={20} color="#14b8a6" />
                    <Text style={styles.contactText}>{selectedGroup.contact}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  member && styles.modalLeaveButton,
                  isFull && !member && styles.modalDisabledButton,
                ]}
                onPress={() => {
                  setModalVisible(false);
                  if (member) {
                    handleLeaveGroup(selectedGroup);
                  } else if (!isFull) {
                    handleJoinGroup(selectedGroup);
                  }
                }}
                disabled={isFull && !member}
              >
                <Text style={[styles.modalActionButtonText, member && styles.modalLeaveButtonText]}>
                  {member ? 'Leave Group' : isFull ? 'Group Full' : 'Join Group'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const filteredGroups = getFilteredGroups();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#14b8a6', '#06b6d4']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Small Groups</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="book" size={32} color="#14b8a6" />
        <Text style={styles.infoTitle}>Small Groups / Life Groups</Text>
        <Text style={styles.infoText}>
          Join intimate, community-focused groups for Bible study, prayer, and fellowship. These are smaller groups (8-20 members) that meet weekly for deeper connection and spiritual growth.
        </Text>
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Ionicons name="people-circle" size={14} color="#14b8a6" />
            <Text style={styles.badgeText}>8-20 Members</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="calendar" size={14} color="#14b8a6" />
            <Text style={styles.badgeText}>Weekly Meetings</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="book" size={14} color="#14b8a6" />
            <Text style={styles.badgeText}>Bible Study</Text>
          </View>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => {
              setFilter('all');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All Groups
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, styles.filterButtonMargin, filter === 'my-groups' && styles.filterButtonActive]}
            onPress={() => {
              setFilter('my-groups');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'my-groups' && styles.filterTextActive]}>
              My Groups
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, styles.filterButtonMargin, filter === 'available' && styles.filterButtonActive]}
            onPress={() => {
              setFilter('available');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'available' && styles.filterTextActive]}>
              Available
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Groups List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#14b8a6" style={styles.loader} />
        ) : filteredGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'No groups found' 
                : filter === 'my-groups'
                  ? 'You haven\'t joined any groups yet'
                  : filter === 'available'
                    ? 'No available groups at the moment'
                    : 'No small groups available'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : filter === 'my-groups'
                  ? 'Join a group to see it here'
                  : 'Check back later for new groups'}
            </Text>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {filteredGroups.map((group, index) => 
              renderGroupCard(group, index, filteredGroups.length)
            )}
          </View>
        )}
      </ScrollView>

      {renderGroupDetails()}
    </View>
  );
}

// Fallback data for when Firestore is empty
const getFallbackGroups = () => [
  {
    id: 'group1',
    name: 'Young Adults Bible Study',
    leader: 'Brother Kwame',
    schedule: 'Tuesdays, 7:00 PM',
    location: 'Church Annex',
    memberCount: 8,
    capacity: 12,
    topic: 'Book of Romans',
    description: 'A vibrant group for young adults seeking to grow in faith and build community.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400',
    contact: '+233 20 123 4567',
  },
  {
    id: 'group2',
    name: 'Women\'s Prayer Circle',
    leader: 'Sister Grace',
    schedule: 'Thursdays, 6:00 PM',
    location: 'Fellowship Hall',
    memberCount: 10,
    capacity: 15,
    topic: 'Prayer & Intercession',
    description: 'A dedicated group of women committed to prayer and supporting one another.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400',
    contact: '+233 24 567 8901',
  },
  {
    id: 'group3',
    name: 'Men\'s Accountability Group',
    leader: 'Pastor Emmanuel',
    schedule: 'Saturdays, 6:00 AM',
    location: 'Church Office',
    memberCount: 6,
    capacity: 10,
    topic: 'Authentic Manhood',
    description: 'Men supporting each other in faith, accountability, and spiritual growth.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e41bcc4?w=400',
    contact: '+233 20 987 6543',
  },
  {
    id: 'group4',
    name: 'New Believers Class',
    leader: 'Pastor Ama',
    schedule: 'Sundays, 2:00 PM',
    location: 'Room 101',
    memberCount: 5,
    capacity: 20,
    topic: 'Foundations of Faith',
    description: 'Perfect for new believers learning the basics of Christianity.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    contact: '+233 24 111 2222',
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
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    margin: 20,
    marginBottom: 10,
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
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#14b8a6',
    fontWeight: '600',
    marginLeft: 4,
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonMargin: {
    marginLeft: 10,
  },
  filterButtonActive: {
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#14b8a6',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#14b8a6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loader: {
    marginTop: 50,
  },
  groupsList: {
    // gap replaced with marginBottom on children
  },
  groupCardMargin: {
    marginBottom: 15,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  memberBadgeText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
    marginLeft: 4,
  },
  fullBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  fullBadgeText: {
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '600',
  },
  groupImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 10,
  },
  groupTopic: {
    fontSize: 14,
    color: '#14b8a6',
    fontWeight: '500',
    marginBottom: 10,
  },
  groupDetails: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItemMargin: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCountText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  actionButton: {
    backgroundColor: '#14b8a6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  leaveButton: {
    backgroundColor: '#fee2e2',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  leaveButtonText: {
    color: '#dc2626',
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
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6b7280',
  },
  modalText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  modalInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    marginHorizontal: -7.5,
  },
  modalInfoCard: {
    width: '47%',
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 7.5,
    marginBottom: 15,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    padding: 12,
    borderRadius: 10,
  },
  contactText: {
    fontSize: 16,
    color: '#14b8a6',
    marginLeft: 10,
    fontWeight: '500',
  },
  modalActionButton: {
    backgroundColor: '#14b8a6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalLeaveButton: {
    backgroundColor: '#fee2e2',
  },
  modalDisabledButton: {
    backgroundColor: '#e5e7eb',
  },
  modalActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalLeaveButtonText: {
    color: '#dc2626',
  },
});

