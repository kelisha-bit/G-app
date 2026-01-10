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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../firebase.config';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  writeBatch 
} from 'firebase/firestore';

export default function ManageMembersScreen({ navigation }) {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // name, date, email
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterAndSortMembers();
  }, [searchQuery, selectedRole, sortBy, sortOrder, members]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const membersList = [];
      
      querySnapshot.forEach((doc) => {
        membersList.push({ id: doc.id, ...doc.data() });
      });
      
      setMembers(membersList);
      setFilteredMembers(membersList);
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const filterAndSortMembers = () => {
    let filtered = [...members];

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(member => member.role === selectedRole);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member =>
        member.displayName?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.phoneNumber?.includes(query)
      );
    }

    // Sort members
    filtered.sort((a, b) => {
      let compareA, compareB;
      
      switch (sortBy) {
        case 'name':
          compareA = (a.displayName || '').toLowerCase();
          compareB = (b.displayName || '').toLowerCase();
          break;
        case 'email':
          compareA = (a.email || '').toLowerCase();
          compareB = (b.email || '').toLowerCase();
          break;
        case 'date':
          compareA = new Date(a.createdAt || 0);
          compareB = new Date(b.createdAt || 0);
          break;
        default:
          compareA = (a.displayName || '').toLowerCase();
          compareB = (b.displayName || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

    setFilteredMembers(filtered);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedMembers([]);
  };

  const toggleMemberSelection = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const selectAllMembers = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id));
    }
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Members',
      `Are you sure you want to delete ${selectedMembers.length} member(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const batch = writeBatch(db);
              selectedMembers.forEach((memberId) => {
                const memberRef = doc(db, 'users', memberId);
                batch.delete(memberRef);
              });
              await batch.commit();
              
              Alert.alert('Success', `${selectedMembers.length} member(s) deleted successfully`);
              setSelectionMode(false);
              setSelectedMembers([]);
              loadMembers();
            } catch (error) {
              console.error('Error deleting members:', error);
              Alert.alert('Error', 'Failed to delete members');
            }
          },
        },
      ]
    );
  };

  const handleExportMembers = () => {
    Alert.alert(
      'Export Members',
      'Export functionality will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setEditModalVisible(true);
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', memberId), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
      
      Alert.alert('Success', 'Member role updated successfully');
      setEditModalVisible(false);
      loadMembers();
    } catch (error) {
      console.error('Error updating member:', error);
      Alert.alert('Error', 'Failed to update member role');
    }
  };

  const handleDeleteMember = (member) => {
    Alert.alert(
      'Delete Member',
      `Are you sure you want to delete ${member.displayName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', member.id));
              Alert.alert('Success', 'Member deleted successfully');
              loadMembers();
            } catch (error) {
              console.error('Error deleting member:', error);
              Alert.alert('Error', 'Failed to delete member');
            }
          },
        },
      ]
    );
  };

  const renderMemberCard = ({ item: member }) => {
    const isSelected = selectedMembers.includes(member.id);
    
    return (
      <TouchableOpacity 
        key={member.id} 
        style={[
          styles.memberCard,
          isSelected && styles.memberCardSelected
        ]}
        onPress={() => selectionMode ? toggleMemberSelection(member.id) : null}
        activeOpacity={selectionMode ? 0.7 : 1}
      >
        {selectionMode && (
          <View style={styles.selectionCheckbox}>
            <Ionicons 
              name={isSelected ? "checkbox" : "square-outline"} 
              size={24} 
              color={isSelected ? "#6366f1" : "#d1d5db"} 
            />
          </View>
        )}
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {member.displayName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.displayName || 'Unknown'}</Text>
          <Text style={styles.memberEmail}>{member.email}</Text>
          <View style={styles.memberMeta}>
            <View style={[styles.roleBadge, member.role === 'admin' ? styles.adminBadge : styles.memberBadge]}>
              <Text style={styles.roleBadgeText}>{member.role || 'member'}</Text>
            </View>
            {member.phoneNumber && (
              <Text style={styles.memberPhone}>📱 {member.phoneNumber}</Text>
            )}
          </View>
        </View>
        {!selectionMode && (
          <View style={styles.memberActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('MemberActivity', {
                memberId: member.id,
                memberName: member.displayName || member.email,
              })}
            >
              <Ionicons name="stats-chart-outline" size={20} color="#f59e0b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditMember(member)}
            >
              <Ionicons name="create-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteMember(member)}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {selectionMode ? `${selectedMembers.length} Selected` : 'Manage Members'}
          </Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={selectionMode ? toggleSelectionMode : handleExportMembers}
          >
            <Ionicons 
              name={selectionMode ? "close" : "download-outline"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search and Action Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setSortModalVisible(true)}
          >
            <Ionicons name="swap-vertical" size={20} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={toggleSelectionMode}
          >
            <Ionicons name="checkbox-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bulk Actions Bar */}
      {selectionMode && (
        <View style={styles.bulkActionsBar}>
          <TouchableOpacity 
            style={styles.bulkActionButton}
            onPress={selectAllMembers}
          >
            <Ionicons 
              name={selectedMembers.length === filteredMembers.length ? "checkbox" : "square-outline"} 
              size={20} 
              color="#6366f1" 
            />
            <Text style={styles.bulkActionText}>Select All</Text>
          </TouchableOpacity>
          {selectedMembers.length > 0 && (
            <TouchableOpacity 
              style={[styles.bulkActionButton, styles.deleteButton]}
              onPress={handleBulkDelete}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete ({selectedMembers.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Role Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'member', 'admin'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.filterButton, selectedRole === role && styles.filterButtonActive]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[styles.filterText, selectedRole === role && styles.filterTextActive]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{members.length}</Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{members.filter(m => m.role === 'admin').length}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredMembers.length}</Text>
          <Text style={styles.statLabel}>Filtered</Text>
        </View>
      </View>

      {/* Members List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderMemberCard}
          keyExtractor={(item) => item.id}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No members found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Members will appear here'}
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Member Role</Text>
            <Text style={styles.modalSubtitle}>{selectedMember?.displayName}</Text>
            <Text style={styles.modalEmail}>{selectedMember?.email}</Text>

            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[styles.roleOption, selectedMember?.role === 'member' && styles.roleOptionSelected]}
                onPress={() => handleUpdateRole(selectedMember?.id, 'member')}
              >
                <Ionicons name="person" size={24} color={selectedMember?.role === 'member' ? '#fff' : '#6366f1'} />
                <Text style={[styles.roleOptionText, selectedMember?.role === 'member' && styles.roleOptionTextSelected]}>
                  Member
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, selectedMember?.role === 'admin' && styles.roleOptionSelected]}
                onPress={() => handleUpdateRole(selectedMember?.id, 'admin')}
              >
                <Ionicons name="shield-checkmark" size={24} color={selectedMember?.role === 'admin' ? '#fff' : '#ef4444'} />
                <Text style={[styles.roleOptionText, selectedMember?.role === 'admin' && styles.roleOptionTextSelected]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort Members</Text>
            
            <Text style={styles.sortSectionLabel}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                { value: 'name', label: 'Name', icon: 'person' },
                { value: 'email', label: 'Email', icon: 'mail' },
                { value: 'date', label: 'Join Date', icon: 'calendar' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.sortOption, sortBy === option.value && styles.sortOptionSelected]}
                  onPress={() => setSortBy(option.value)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={sortBy === option.value ? '#fff' : '#6366f1'} 
                  />
                  <Text style={[styles.sortOptionText, sortBy === option.value && styles.sortOptionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sortSectionLabel}>Order</Text>
            <View style={styles.sortOptions}>
              <TouchableOpacity
                style={[styles.sortOption, sortOrder === 'asc' && styles.sortOptionSelected]}
                onPress={() => setSortOrder('asc')}
              >
                <Ionicons 
                  name="arrow-up" 
                  size={20} 
                  color={sortOrder === 'asc' ? '#fff' : '#6366f1'} 
                />
                <Text style={[styles.sortOptionText, sortOrder === 'asc' && styles.sortOptionTextSelected]}>
                  Ascending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortOption, sortOrder === 'desc' && styles.sortOptionSelected]}
                onPress={() => setSortOrder('desc')}
              >
                <Ionicons 
                  name="arrow-down" 
                  size={20} 
                  color={sortOrder === 'desc' ? '#fff' : '#6366f1'} 
                />
                <Text style={[styles.sortOptionText, sortOrder === 'desc' && styles.sortOptionTextSelected]}>
                  Descending
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSortModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    padding: 20,
    paddingBottom: 10,
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#1f2937',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bulkActionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 10,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  bulkActionText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
    flex: 1,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
    justifyContent: 'space-between',
  },
  statItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  emptyContainer: {
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
  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  memberCardSelected: {
    backgroundColor: '#ede9fe',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  selectionCheckbox: {
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: '#fef2f2',
  },
  memberBadge: {
    backgroundColor: '#ede9fe',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
  },
  memberPhone: {
    fontSize: 12,
    color: '#6b7280',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalEmail: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  roleOptionSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  roleOptionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  roleOptionTextSelected: {
    color: '#fff',
  },
  modalCloseButton: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  sortSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 15,
    marginBottom: 10,
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  sortOptionSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  sortOptionTextSelected: {
    color: '#fff',
  },
});


