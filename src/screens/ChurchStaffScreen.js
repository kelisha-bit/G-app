import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebase.config';
import { collection, getDocs } from 'firebase/firestore';

export default function ChurchStaffScreen({ navigation }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Staff hierarchy order
  const hierarchyOrder = {
    'Senior Pastor': 1,
    'Associate Pastor': 2,
    'Assistant Pastor': 3,
    'Department Head': 4,
    'Church Secretary': 5,
    'Ministry Leader': 6,
    'Staff': 7,
    'Other': 8,
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      // Query without orderBy to avoid index issues, we'll sort client-side
      const q = collection(db, 'churchStaff');
      const querySnapshot = await getDocs(q);
      const staffList = [];

      querySnapshot.forEach((doc) => {
        staffList.push({ id: doc.id, ...doc.data() });
      });

      // Sort by hierarchy if order is not set
      staffList.sort((a, b) => {
        const orderA = a.order || hierarchyOrder[a.position] || 999;
        const orderB = b.order || hierarchyOrder[b.position] || 999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || '').localeCompare(b.name || '');
      });

      setStaff(staffList);
    } catch (error) {
      console.error('Error loading staff:', error);
      Alert.alert('Error', 'Failed to load staff members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStaff();
  };

  const filteredStaff = staff.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.name?.toLowerCase().includes(query) ||
      member.position?.toLowerCase().includes(query) ||
      member.department?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query)
    );
  });

  const openDetails = (member) => {
    setSelectedStaff(member);
    setDetailsModalVisible(true);
  };

  const handleCall = (phone) => {
    if (!phone) {
      Alert.alert('No Phone', 'This staff member has not provided a phone number.');
      return;
    }
    const phoneNumber = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      console.error('Error opening phone:', err);
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleEmail = (email) => {
    if (!email) {
      Alert.alert('No Email', 'This staff member has not provided an email address.');
      return;
    }
    Linking.openURL(`mailto:${email}`).catch((err) => {
      console.error('Error opening email:', err);
      Alert.alert('Error', 'Unable to open email');
    });
  };

  const groupStaffByPosition = () => {
    const grouped = {};
    filteredStaff.forEach((member) => {
      const position = member.position || 'Other';
      if (!grouped[position]) {
        grouped[position] = [];
      }
      grouped[position].push(member);
    });
    return grouped;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading staff...</Text>
      </View>
    );
  }

  const groupedStaff = groupStaffByPosition();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Church Staff</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff by name, position, or department..."
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

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredStaff.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No staff members found' : 'No staff members yet'}
            </Text>
            {!searchQuery && (
              <Text style={styles.emptySubtext}>
                Staff members will appear here once added by an administrator.
              </Text>
            )}
          </View>
        ) : (
          Object.keys(groupedStaff)
            .sort((a, b) => {
              const orderA = hierarchyOrder[a] || 999;
              const orderB = hierarchyOrder[b] || 999;
              return orderA - orderB;
            })
            .map((position) => (
              <View key={position} style={styles.section}>
                <Text style={styles.sectionTitle}>{position}</Text>
                {groupedStaff[position].map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.staffCard}
                    onPress={() => openDetails(member)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.staffCardContent}>
                      {member.profilePicture ? (
                        <Image
                          source={{ uri: member.profilePicture }}
                          style={styles.profileImage}
                        />
                      ) : (
                        <View style={styles.profilePlaceholder}>
                          <Text style={styles.profilePlaceholderText}>
                            {member.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase() || 'S'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.staffInfo}>
                        <Text style={styles.staffName}>{member.name || 'Unknown'}</Text>
                        <Text style={styles.staffPosition}>{member.position || 'Staff'}</Text>
                        {member.department && (
                          <Text style={styles.staffDepartment}>{member.department}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Staff Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Staff Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedStaff && (
                <>
                  <View style={styles.modalProfileSection}>
                    {selectedStaff.profilePicture ? (
                      <Image
                        source={{ uri: selectedStaff.profilePicture }}
                        style={styles.modalProfileImage}
                      />
                    ) : (
                      <View style={styles.modalProfilePlaceholder}>
                        <Text style={styles.modalProfilePlaceholderText}>
                          {selectedStaff.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase() || 'S'}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.modalName}>{selectedStaff.name || 'Unknown'}</Text>
                    <Text style={styles.modalPosition}>{selectedStaff.position || 'Staff'}</Text>
                    {selectedStaff.department && (
                      <Text style={styles.modalDepartment}>{selectedStaff.department}</Text>
                    )}
                  </View>

                  {selectedStaff.bio && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>About</Text>
                      <Text style={styles.modalBio}>{selectedStaff.bio}</Text>
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Contact Information</Text>
                    {selectedStaff.email && (
                      <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => handleEmail(selectedStaff.email)}
                      >
                        <Ionicons name="mail" size={20} color="#6366f1" />
                        <Text style={styles.contactText}>{selectedStaff.email}</Text>
                      </TouchableOpacity>
                    )}
                    {selectedStaff.phone && (
                      <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => handleCall(selectedStaff.phone)}
                      >
                        <Ionicons name="call" size={20} color="#6366f1" />
                        <Text style={styles.contactText}>{selectedStaff.phone}</Text>
                      </TouchableOpacity>
                    )}
                    {!selectedStaff.email && !selectedStaff.phone && (
                      <Text style={styles.noContactText}>No contact information available</Text>
                    )}
                  </View>

                  {selectedStaff.officeHours && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Office Hours</Text>
                      <Text style={styles.officeHours}>{selectedStaff.officeHours}</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    paddingLeft: 5,
  },
  staffCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  staffCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profilePlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  staffPosition: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
    marginBottom: 2,
  },
  staffDepartment: {
    fontSize: 13,
    color: '#6b7280',
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalProfileSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  modalProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  modalProfilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalProfilePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  modalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalPosition: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: '500',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalDepartment: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 25,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  modalBio: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 15,
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  noContactText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  officeHours: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
});

