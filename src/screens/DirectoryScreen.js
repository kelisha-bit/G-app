import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  RefreshControl,
  ActivityIndicator,
  Modal,
  SectionList,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase.config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function DirectoryScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // list or sections

  const categories = ['All', 'Admin', 'Member'];

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to view the directory.');
        setMembers([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const q = query(collection(db, 'users'), orderBy('displayName', 'asc'));
      const querySnapshot = await getDocs(q);
      const membersList = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const privacySettings = data.privacySettings || {};
        const profileVisibility = privacySettings.profileVisibility || 'public';
        const allowDirectoryListing = privacySettings.allowDirectoryListing !== false; // default to true
        
        // Skip if directory listing is disabled
        if (!allowDirectoryListing) {
          return;
        }
        
        // Skip if profile is private and not the current user's profile
        if (profileVisibility === 'private' && doc.id !== currentUser.uid) {
          return;
        }
        
        // Skip if profile is members-only and user is not authenticated (already checked above)
        // For now, if profileVisibility is 'members', we allow all authenticated users
        // If you want stricter control, you could check if user has a role or is a verified member
        
        // Respect privacy settings for individual fields
        const showEmail = privacySettings.showEmail !== false; // default to true
        const showPhone = privacySettings.showPhone === true; // default to false
        
        membersList.push({
          id: doc.id,
          name: data.displayName || 'Unknown',
          email: showEmail ? (data.email || '') : '',
          phone: showPhone ? (data.phoneNumber || data.phone || '') : '',
          role: data.role || 'member',
          category: data.role === 'admin' ? 'Admin' : 'Member',
          departments: data.departments || [],
          ministries: data.ministries || [],
          bio: data.bio || '',
          joinDate: data.createdAt || '',
          profilePicture: data.profilePicture || data.photoURL || data.profileImage || null,
          isCurrentUser: doc.id === currentUser.uid,
        });
      });
      
      setMembers(membersList);
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'Failed to load directory. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
  };

  const filteredDirectory = members.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.phone.includes(searchQuery);
    const matchesCategory =
      selectedCategory === 'All' || person.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group members by first letter for section list
  const getSectionedData = () => {
    const grouped = {};
    filteredDirectory.forEach((person) => {
      const firstLetter = person.name.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(person);
    });

    return Object.keys(grouped)
      .sort()
      .map((letter) => ({
        title: letter,
        data: grouped[letter],
      }));
  };

  const handleCall = (phone) => {
    if (!phone) {
      Alert.alert('No Phone', 'This member has not provided a phone number.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email) => {
    if (!email) {
      Alert.alert('No Email', 'This member has not provided an email address.');
      return;
    }
    Linking.openURL(`mailto:${email}`);
  };

  const handleSMS = (phone) => {
    if (!phone) {
      Alert.alert('No Phone', 'This member has not provided a phone number.');
      return;
    }
    Linking.openURL(`sms:${phone}`);
  };

  const handleWhatsApp = (phone) => {
    if (!phone) {
      Alert.alert('No Phone', 'This member has not provided a phone number.');
      return;
    }
    // Remove any non-digit characters and add country code if needed
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
  };

  const handleViewDetails = (person) => {
    setSelectedMember(person);
    setDetailsModalVisible(true);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'sections' : 'list');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Avatar component that handles profile pictures
  const AvatarImage = ({ person, size = 60 }) => {
    const [imageError, setImageError] = useState(false);
    const isLarge = size === 100;
    
    if (person.profilePicture && !imageError) {
      return (
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: person.profilePicture }}
            style={isLarge ? styles.detailsAvatarImage : styles.avatarImage}
            onError={() => setImageError(true)}
          />
        </View>
      );
    }
    
    return (
      <View style={isLarge ? styles.detailsAvatarPlaceholder : styles.avatarPlaceholder}>
        <Text style={isLarge ? styles.detailsAvatarText : styles.avatarText}>
          {getInitials(person.name)}
        </Text>
      </View>
    );
  };

  const renderMemberCard = (person) => (
    <TouchableOpacity 
      key={person.id} 
      style={styles.personCard}
      onPress={() => handleViewDetails(person)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <AvatarImage person={person} size={60} />
      </View>
      <View style={styles.personInfo}>
        <View style={styles.personHeader}>
          <Text style={styles.personName}>{person.name}</Text>
          {person.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#ef4444" />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
        {person.email && (
          <Text style={styles.personEmail}>{person.email}</Text>
        )}
        {person.phone && (
          <Text style={styles.personPhone}>📱 {person.phone}</Text>
        )}
        <View style={styles.contactRow}>
          {person.phone && (
            <>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleCall(person.phone)}
              >
                <Ionicons name="call" size={16} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleSMS(person.phone)}
              >
                <Ionicons name="chatbubble" size={16} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleWhatsApp(person.phone)}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              </TouchableOpacity>
            </>
          )}
          {person.email && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleEmail(person.email)}
            >
              <Ionicons name="mail" size={16} color="#f59e0b" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Directory</Text>
          <Text style={styles.headerSubtitle}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={toggleViewMode}
        >
          <Ionicons 
            name={viewMode === 'list' ? 'list' : 'grid'} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or phone..."
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

      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading directory...</Text>
        </View>
      ) : viewMode === 'sections' && filteredDirectory.length > 0 ? (
        <SectionList
          sections={getSectionedData()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderMemberCard(item)}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366f1']}
              tintColor="#6366f1"
            />
          }
          stickySectionHeadersEnabled={true}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No members found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Members will appear here'}
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366f1']}
              tintColor="#6366f1"
            />
          }
        >
          {filteredDirectory.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No members found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Members will appear here'}
              </Text>
            </View>
          ) : (
            filteredDirectory.map((person) => renderMemberCard(person))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Member Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedMember && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailsAvatarContainer}>
                  <View style={styles.detailsAvatar}>
                    <AvatarImage person={selectedMember} size={100} />
                  </View>
                  <Text style={styles.detailsName}>{selectedMember.name}</Text>
                  {selectedMember.role === 'admin' && (
                    <View style={styles.adminBadgeLarge}>
                      <Ionicons name="shield-checkmark" size={16} color="#ef4444" />
                      <Text style={styles.adminBadgeTextLarge}>Administrator</Text>
                    </View>
                  )}
                </View>

                {selectedMember.bio && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>About</Text>
                    <Text style={styles.detailValue}>{selectedMember.bio}</Text>
                  </View>
                )}

                {(selectedMember.email || selectedMember.phone) && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Contact Information</Text>
                    {selectedMember.email && (
                      <View style={styles.detailRow}>
                        <Ionicons name="mail" size={20} color="#6366f1" />
                        <Text style={styles.detailText}>{selectedMember.email}</Text>
                      </View>
                    )}
                    {selectedMember.phone && (
                      <View style={styles.detailRow}>
                        <Ionicons name="call" size={20} color="#6366f1" />
                        <Text style={styles.detailText}>{selectedMember.phone}</Text>
                      </View>
                    )}
                  </View>
                )}

                {selectedMember.departments && selectedMember.departments.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Departments</Text>
                    <View style={styles.tagsContainer}>
                      {selectedMember.departments.map((dept, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{dept}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedMember.ministries && selectedMember.ministries.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Ministries</Text>
                    <View style={styles.tagsContainer}>
                      {selectedMember.ministries.map((ministry, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{ministry}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedMember.joinDate && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Member Since</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedMember.joinDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  {selectedMember.phone && (
                    <>
                      <TouchableOpacity
                        style={styles.modalActionButton}
                        onPress={() => {
                          handleCall(selectedMember.phone);
                          setDetailsModalVisible(false);
                        }}
                      >
                        <Ionicons name="call" size={20} color="#fff" />
                        <Text style={styles.modalActionText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalActionButton, { backgroundColor: '#10b981' }]}
                        onPress={() => {
                          handleSMS(selectedMember.phone);
                          setDetailsModalVisible(false);
                        }}
                      >
                        <Ionicons name="chatbubble" size={20} color="#fff" />
                        <Text style={styles.modalActionText}>SMS</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalActionButton, { backgroundColor: '#25D366' }]}
                        onPress={() => {
                          handleWhatsApp(selectedMember.phone);
                          setDetailsModalVisible(false);
                        }}
                      >
                        <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                        <Text style={styles.modalActionText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {selectedMember.email && (
                    <TouchableOpacity
                      style={[styles.modalActionButton, { backgroundColor: '#f59e0b' }]}
                      onPress={() => {
                        handleEmail(selectedMember.email);
                        setDetailsModalVisible(false);
                      }}
                    >
                      <Ionicons name="mail" size={20} color="#fff" />
                      <Text style={styles.modalActionText}>Email</Text>
                    </TouchableOpacity>
                  )}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
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
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  categoriesContainer: {
    paddingVertical: 15,
    paddingLeft: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
  },
  categoryChipSelected: {
    backgroundColor: '#6366f1',
  },
  categoryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  personInfo: {
    flex: 1,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  personEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  personPhone: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  adminBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  adminBadgeTextLarge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 6,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  detailsAvatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  detailsAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsAvatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailsName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    minWidth: '45%',
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

