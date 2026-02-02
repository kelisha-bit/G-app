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
  Timestamp,
} from 'firebase/firestore';

export default function ManageServiceLeadersScreen({ navigation }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Form state
  const [serviceDate, setServiceDate] = useState('');
  const [serviceTime, setServiceTime] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');

  const roles = [
    'Worship Leader',
    'Preacher',
    'Usher Leader',
    'Prayer Leader',
    'Scripture Reader',
    'Announcement Leader',
    'Offering Leader',
    'Children\'s Service Leader',
    'Youth Service Leader',
    'Other',
  ];

  useEffect(() => {
    loadRoster();
  }, []);

  const loadRoster = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      // Query without orderBy to avoid index issues, we'll sort client-side
      const q = collection(db, 'serviceLeaders');
      const querySnapshot = await getDocs(q);
      const rosterList = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        rosterList.push({
          id: doc.id,
          ...data,
          serviceDate: data.serviceDate?.toDate ? data.serviceDate.toDate() : new Date(data.serviceDate),
        });
      });

      // Sort by date descending (newest first)
      rosterList.sort((a, b) => {
        const dateA = a.serviceDate instanceof Date ? a.serviceDate : new Date(a.serviceDate);
        const dateB = b.serviceDate instanceof Date ? b.serviceDate : new Date(b.serviceDate);
        return dateB - dateA;
      });

      setRoster(rosterList);
    } catch (error) {
      console.error('Error loading roster:', error);
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        Alert.alert(
          'Permission Error',
          'Unable to access service leaders roster. Please ensure:\n\n1. Firestore rules have been deployed\n2. You are logged in as an admin\n3. The serviceLeaders collection rules are active',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', `Failed to load service leaders roster: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoster();
  };

  const openCreateModal = () => {
    setEditMode(false);
    resetForm();
    // Set default date to today
    const today = new Date();
    setServiceDate(today.toISOString().split('T')[0]);
    setModalVisible(true);
  };

  const openEditModal = (entry) => {
    setEditMode(true);
    setSelectedEntry(entry);
    const date = entry.serviceDate instanceof Date 
      ? entry.serviceDate 
      : new Date(entry.serviceDate);
    setServiceDate(date.toISOString().split('T')[0]);
    setServiceTime(entry.serviceTime || '');
    setLeaderName(entry.leaderName || '');
    setRole(entry.role || '');
    setNotes(entry.notes || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setServiceDate('');
    setServiceTime('');
    setLeaderName('');
    setRole('');
    setNotes('');
    setSelectedEntry(null);
  };

  const handleSave = async () => {
    if (!serviceDate || !leaderName || !role) {
      Alert.alert('Validation Error', 'Please fill in service date, leader name, and role');
      return;
    }

    try {
      const serviceDateObj = new Date(serviceDate);
      serviceDateObj.setHours(0, 0, 0, 0);

      const rosterData = {
        serviceDate: Timestamp.fromDate(serviceDateObj),
        serviceTime: serviceTime.trim() || null,
        leaderName: leaderName.trim(),
        role: role.trim(),
        notes: notes.trim() || null,
        updatedAt: new Date().toISOString(),
      };

      if (editMode && selectedEntry) {
        await updateDoc(doc(db, 'serviceLeaders', selectedEntry.id), rosterData);
        Alert.alert('Success', 'Service leader entry updated successfully');
      } else {
        await addDoc(collection(db, 'serviceLeaders'), {
          ...rosterData,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Success', 'Service leader entry added successfully');
      }

      setModalVisible(false);
      resetForm();
      loadRoster();
    } catch (error) {
      console.error('Error saving roster entry:', error);
      Alert.alert('Error', 'Failed to save service leader entry');
    }
  };

  const handleDelete = (entry) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete the service leader entry for ${formatDate(entry.serviceDate)}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'serviceLeaders', entry.id));
              Alert.alert('Success', 'Service leader entry deleted successfully');
              loadRoster();
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete service leader entry');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    // If time is in HH:MM format, format it nicely
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return time;
  };

  const filteredRoster = roster.filter((entry) => {
    const matchesSearch = 
      !searchQuery ||
      entry.leaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.role?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = 
      !filterDate ||
      (entry.serviceDate instanceof Date 
        ? entry.serviceDate.toISOString().split('T')[0] === filterDate
        : new Date(entry.serviceDate).toISOString().split('T')[0] === filterDate);
    
    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading roster...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Leaders Roster</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or role..."
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
          <Ionicons name="calendar" size={18} color="#6b7280" style={styles.filterIcon} />
          <TextInput
            style={styles.filterInput}
            placeholder="Filter by date (YYYY-MM-DD)"
            value={filterDate}
            onChangeText={setFilterDate}
            placeholderTextColor="#9ca3af"
          />
          {filterDate.length > 0 && (
            <TouchableOpacity onPress={() => setFilterDate('')}>
              <Ionicons name="close-circle" size={18} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Service Leader</Text>
          </LinearGradient>
        </TouchableOpacity>

        {filteredRoster.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery || filterDate ? 'No matching entries' : 'No service leaders yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || filterDate
                ? 'Try adjusting your search or filter'
                : 'Add your first service leader entry to get started'}
            </Text>
          </View>
        ) : (
          filteredRoster.map((entry) => (
            <View key={entry.id} style={styles.rosterCard}>
              <View style={styles.rosterCardHeader}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar" size={20} color="#6366f1" />
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateText}>{formatDate(entry.serviceDate)}</Text>
                    {entry.serviceTime && (
                      <Text style={styles.timeText}>{formatTime(entry.serviceTime)}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(entry)}
                  >
                    <Ionicons name="create-outline" size={20} color="#6366f1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(entry)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.rosterCardBody}>
                <View style={styles.leaderInfo}>
                  <Ionicons name="person" size={18} color="#8b5cf6" />
                  <Text style={styles.leaderName}>{entry.leaderName}</Text>
                </View>
                <View style={styles.roleInfo}>
                  <Ionicons name="ribbon" size={18} color="#10b981" />
                  <Text style={styles.roleText}>{entry.role}</Text>
                </View>
                {entry.notes && (
                  <View style={styles.notesInfo}>
                    <Ionicons name="document-text" size={18} color="#f59e0b" />
                    <Text style={styles.notesText}>{entry.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Edit Service Leader' : 'Add Service Leader'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Service Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={serviceDate}
                  onChangeText={setServiceDate}
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 2024-12-25)</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Service Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM (e.g., 09:00)"
                  value={serviceTime}
                  onChangeText={setServiceTime}
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.helperText}>Format: HH:MM (24-hour format)</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Leader Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter leader's full name"
                  value={leaderName}
                  onChangeText={setLeaderName}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.roleContainer}>
                    {roles.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.roleChip,
                          role === r && styles.roleChipSelected,
                        ]}
                        onPress={() => setRole(r)}
                      >
                        <Text
                          style={[
                            styles.roleChipText,
                            role === r && styles.roleChipTextSelected,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Additional notes or instructions..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {editMode ? 'Update Entry' : 'Add Entry'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
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
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterIcon: {
    marginRight: 10,
  },
  filterInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
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
  rosterCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  rosterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateInfo: {
    marginLeft: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosterCardBody: {
    padding: 15,
    paddingTop: 10,
  },
  leaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 10,
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleText: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 10,
  },
  notesInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 10,
    flex: 1,
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  roleChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  roleChipText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  roleChipTextSelected: {
    color: '#fff',
  },
  saveButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

