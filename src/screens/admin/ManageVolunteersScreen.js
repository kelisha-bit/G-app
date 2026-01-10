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
  Modal,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../firebase.config';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';

export default function ManageVolunteersScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('opportunities'); // 'opportunities' or 'applications'
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Form state for opportunities
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [time, setTime] = useState('');
  const [icon, setIcon] = useState('people');
  const [color, setColor] = useState('#6366f1');
  const [totalSpots, setTotalSpots] = useState('');

  const departments = ['Ushering', 'Children Ministry', 'Media & Tech', 'Prayer Team', 'Hospitality', 'Evangelism', 'Worship', 'Youth', 'Other'];
  const icons = ['people', 'happy', 'videocam', 'hand-left', 'restaurant', 'megaphone', 'musical-notes', 'school', 'heart', 'book', 'calendar'];
  const colors = ['#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#14b8a6', '#ef4444', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'opportunities') {
        await loadOpportunities();
      } else {
        await loadApplications();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const loadOpportunities = async () => {
    try {
      let querySnapshot;
      try {
        const q = query(collection(db, 'volunteerOpportunities'), orderBy('title', 'asc'));
        querySnapshot = await getDocs(q);
      } catch (error) {
        // Fallback if orderBy fails
        querySnapshot = await getDocs(collection(db, 'volunteerOpportunities'));
      }
      
      const opportunitiesList = [];
      querySnapshot.forEach((doc) => {
        opportunitiesList.push({ id: doc.id, ...doc.data() });
      });
      
      setOpportunities(opportunitiesList);
    } catch (error) {
      console.error('Error loading opportunities:', error);
      setOpportunities([]);
    }
  };

  const loadApplications = async () => {
    try {
      const q = query(collection(db, 'volunteerApplications'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const applicationsList = [];
      
      querySnapshot.forEach((doc) => {
        applicationsList.push({ id: doc.id, ...doc.data() });
      });
      
      setApplications(applicationsList);
    } catch (error) {
      console.error('Error loading applications:', error);
      setApplications([]);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (opportunity) => {
    setEditMode(true);
    setSelectedOpportunity(opportunity);
    setTitle(opportunity.title || '');
    setDepartment(opportunity.department || '');
    setTime(opportunity.time || '');
    setIcon(opportunity.icon || 'people');
    setColor(opportunity.color || '#6366f1');
    setTotalSpots((opportunity.totalSpots || opportunity.spots || '').toString());
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setDepartment('');
    setTime('');
    setIcon('people');
    setColor('#6366f1');
    setTotalSpots('');
    setSelectedOpportunity(null);
  };

  const handleSaveOpportunity = async () => {
    if (!title || !department || !time || !totalSpots) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const spots = parseInt(totalSpots);
    if (isNaN(spots) || spots < 1) {
      Alert.alert('Validation Error', 'Total spots must be a positive number');
      return;
    }

    try {
      const opportunityData = {
        title: title.trim(),
        department: department.trim(),
        time: time.trim(),
        icon: icon,
        color: color,
        totalSpots: spots,
        updatedAt: new Date().toISOString(),
      };

      if (editMode && selectedOpportunity) {
        await updateDoc(doc(db, 'volunteerOpportunities', selectedOpportunity.id), opportunityData);
        Alert.alert('Success', 'Opportunity updated successfully');
      } else {
        await addDoc(collection(db, 'volunteerOpportunities'), {
          ...opportunityData,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Success', 'Opportunity created successfully');
      }

      setModalVisible(false);
      resetForm();
      loadOpportunities();
    } catch (error) {
      console.error('Error saving opportunity:', error);
      Alert.alert('Error', 'Failed to save opportunity');
    }
  };

  const handleDeleteOpportunity = (opportunity) => {
    Alert.alert(
      'Delete Opportunity',
      `Are you sure you want to delete "${opportunity.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'volunteerOpportunities', opportunity.id));
              Alert.alert('Success', 'Opportunity deleted successfully');
              loadOpportunities();
            } catch (error) {
              console.error('Error deleting opportunity:', error);
              Alert.alert('Error', 'Failed to delete opportunity');
            }
          },
        },
      ]
    );
  };

  const handleUpdateApplicationStatus = async (application, newStatus) => {
    try {
      await updateDoc(doc(db, 'volunteerApplications', application.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      Alert.alert('Success', `Application ${newStatus} successfully`);
      loadApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      Alert.alert('Error', 'Failed to update application status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getApplicationCount = (opportunityId) => {
    return applications.filter(app => app.opportunityId === opportunityId).length;
  };

  const getPendingCount = () => {
    return applications.filter(app => app.status === 'pending').length;
  };

  const getApprovedCount = () => {
    return applications.filter(app => app.status === 'approved').length;
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
        <Text style={styles.headerTitle}>Manage Volunteers</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'opportunities' && styles.tabActive]}
          onPress={() => setActiveTab('opportunities')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={activeTab === 'opportunities' ? '#6366f1' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'opportunities' && styles.tabTextActive]}>
            Opportunities
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'applications' && styles.tabActive]}
          onPress={() => setActiveTab('applications')}
        >
          <Ionicons 
            name="document-text" 
            size={20} 
            color={activeTab === 'applications' ? '#6366f1' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'applications' && styles.tabTextActive]}>
            Applications ({applications.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      {activeTab === 'applications' && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getPendingCount()}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{getApprovedCount()}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{applications.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
          }
        >
          {activeTab === 'opportunities' ? (
            <>
              <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Add Opportunity</Text>
              </TouchableOpacity>

              {opportunities.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="heart-outline" size={64} color="#d1d5db" />
                  <Text style={styles.emptyText}>No opportunities yet</Text>
                  <Text style={styles.emptySubtext}>Create your first volunteer opportunity</Text>
                </View>
              ) : (
                opportunities.map((opportunity) => {
                  const applicationCount = getApplicationCount(opportunity.id);
                  return (
                    <View key={opportunity.id} style={styles.opportunityCard}>
                      <View style={[styles.opportunityIcon, { backgroundColor: opportunity.color }]}>
                        <Ionicons name={opportunity.icon} size={28} color="#fff" />
                      </View>
                      <View style={styles.opportunityInfo}>
                        <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
                        <Text style={styles.opportunityDepartment}>{opportunity.department}</Text>
                        <View style={styles.opportunityMeta}>
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color="#6b7280" />
                            <Text style={styles.metaText}>{opportunity.time}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="people-outline" size={14} color="#6b7280" />
                            <Text style={styles.metaText}>
                              {opportunity.totalSpots || opportunity.spots} spots • {applicationCount} applied
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.opportunityActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => openEditModal(opportunity)}
                        >
                          <Ionicons name="create-outline" size={20} color="#6366f1" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeleteOpportunity(opportunity)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          ) : (
            <>
              {applications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
                  <Text style={styles.emptyText}>No applications yet</Text>
                  <Text style={styles.emptySubtext}>Applications will appear here</Text>
                </View>
              ) : (
                applications.map((application) => (
                  <View key={application.id} style={styles.applicationCard}>
                    <View style={styles.applicationHeader}>
                      <View style={styles.applicationInfo}>
                        <Text style={styles.applicationName}>{application.userName || 'Member'}</Text>
                        <Text style={styles.applicationEmail}>{application.userEmail || ''}</Text>
                        <Text style={styles.applicationOpportunity}>
                          {application.opportunityTitle || 'Volunteer Opportunity'}
                        </Text>
                        <Text style={styles.applicationDepartment}>
                          {application.opportunityDepartment || ''}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
                          {application.status?.toUpperCase() || 'PENDING'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.applicationDate}>
                      Applied: {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}
                    </Text>
                    {application.status === 'pending' && (
                      <View style={styles.applicationActions}>
                        <TouchableOpacity
                          style={[styles.statusButton, styles.approveButton]}
                          onPress={() => handleUpdateApplicationStatus(application, 'approved')}
                        >
                          <Ionicons name="checkmark-circle" size={18} color="#fff" />
                          <Text style={styles.statusButtonText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.statusButton, styles.rejectButton]}
                          onPress={() => handleUpdateApplicationStatus(application, 'rejected')}
                        >
                          <Ionicons name="close-circle" size={18} color="#fff" />
                          <Text style={styles.statusButtonText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Edit Opportunity' : 'Create Opportunity'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Sunday Service Usher"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Department *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.departmentScroll}>
                  {departments.map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={[styles.departmentChip, department === dept && styles.departmentChipSelected]}
                      onPress={() => setDepartment(dept)}
                    >
                      <Text style={[styles.departmentChipText, department === dept && styles.departmentChipTextSelected]}>
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Time/Schedule *</Text>
                <TextInput
                  style={styles.input}
                  value={time}
                  onChangeText={setTime}
                  placeholder="e.g., Sundays, 8:30 AM - 12:00 PM"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
                  {icons.map((iconName) => (
                    <TouchableOpacity
                      key={iconName}
                      style={[styles.iconButton, icon === iconName && styles.iconButtonSelected]}
                      onPress={() => setIcon(iconName)}
                    >
                      <Ionicons name={iconName} size={24} color={icon === iconName ? '#fff' : '#6b7280'} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
                  {colors.map((colorValue) => (
                    <TouchableOpacity
                      key={colorValue}
                      style={[styles.colorButton, { backgroundColor: colorValue }, color === colorValue && styles.colorButtonSelected]}
                      onPress={() => setColor(colorValue)}
                    >
                      {color === colorValue && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Total Spots *</Text>
                <TextInput
                  style={styles.input}
                  value={totalSpots}
                  onChangeText={setTotalSpots}
                  placeholder="e.g., 5"
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveOpportunity}
              >
                <Text style={styles.saveButtonText}>{editMode ? 'Update' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  tabActive: {
    backgroundColor: '#f0f9ff',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#6366f1',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  opportunityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  opportunityIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  opportunityInfo: {
    flex: 1,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  opportunityDepartment: {
    fontSize: 13,
    color: '#6366f1',
    marginBottom: 8,
    fontWeight: '600',
  },
  opportunityMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 5,
  },
  opportunityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  applicationCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  applicationInfo: {
    flex: 1,
  },
  applicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  applicationEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  applicationOpportunity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 4,
  },
  applicationDepartment: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  applicationDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#1f2937',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  departmentScroll: {
    marginTop: 8,
  },
  departmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  departmentChipSelected: {
    backgroundColor: '#6366f1',
  },
  departmentChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  departmentChipTextSelected: {
    color: '#fff',
  },
  iconScroll: {
    marginTop: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconButtonSelected: {
    backgroundColor: '#6366f1',
  },
  colorScroll: {
    marginTop: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#1f2937',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

