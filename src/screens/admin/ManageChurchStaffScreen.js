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
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../../../firebase.config';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ManageChurchStaffScreen({ navigation }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [order, setOrder] = useState('');

  const positions = [
    'Senior Pastor',
    'Associate Pastor',
    'Assistant Pastor',
    'Department Head',
    'Church Secretary',
    'Ministry Leader',
    'Staff',
    'Other',
  ];

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

  const openCreateModal = () => {
    setEditMode(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (staffMember) => {
    setEditMode(true);
    setSelectedStaff(staffMember);
    setName(staffMember.name || '');
    setPosition(staffMember.position || '');
    setDepartment(staffMember.department || '');
    setEmail(staffMember.email || '');
    setPhone(staffMember.phone || '');
    setBio(staffMember.bio || '');
    setOfficeHours(staffMember.officeHours || '');
    setProfilePicture(staffMember.profilePicture || '');
    setImagePreview(staffMember.profilePicture || null);
    setOrder(staffMember.order?.toString() || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setName('');
    setPosition('');
    setDepartment('');
    setEmail('');
    setPhone('');
    setBio('');
    setOfficeHours('');
    setProfilePicture('');
    setImagePreview(null);
    setOrder('');
    setSelectedStaff(null);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploadingImage(true);

      const response = await fetch(uri);
      const blob = await response.blob();

      const timestamp = Date.now();
      const filename = `churchStaff/${timestamp}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      setProfilePicture(downloadURL);
      setImagePreview(downloadURL);
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!name || !position) {
      Alert.alert('Validation Error', 'Please fill in name and position');
      return;
    }

    try {
      const staffData = {
        name: name.trim(),
        position: position.trim(),
        department: department.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        officeHours: officeHours.trim() || null,
        profilePicture: profilePicture.trim() || null,
        order: order ? parseInt(order) : hierarchyOrder[position] || 999,
        updatedAt: new Date().toISOString(),
      };

      if (editMode && selectedStaff) {
        await updateDoc(doc(db, 'churchStaff', selectedStaff.id), staffData);
        Alert.alert('Success', 'Staff member updated successfully');
      } else {
        await addDoc(collection(db, 'churchStaff'), {
          ...staffData,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Success', 'Staff member added successfully');
      }

      setModalVisible(false);
      resetForm();
      loadStaff();
    } catch (error) {
      console.error('Error saving staff:', error);
      Alert.alert('Error', 'Failed to save staff member');
    }
  };

  const handleDelete = (staffMember) => {
    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to delete ${staffMember.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'churchStaff', staffMember.id));
              Alert.alert('Success', 'Staff member deleted successfully');
              loadStaff();
            } catch (error) {
              console.error('Error deleting staff:', error);
              Alert.alert('Error', 'Failed to delete staff member');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading staff...</Text>
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
        <Text style={styles.headerTitle}>Manage Church Staff</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

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
            <Text style={styles.addButtonText}>Add Staff Member</Text>
          </LinearGradient>
        </TouchableOpacity>

        {staff.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No staff members yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first staff member to get started
            </Text>
          </View>
        ) : (
          staff.map((member) => (
            <View key={member.id} style={styles.staffCard}>
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
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(member)}
                  >
                    <Ionicons name="create-outline" size={20} color="#6366f1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(member)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
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
                {editMode ? 'Edit Staff Member' : 'Add Staff Member'}
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
              <View style={styles.imagePickerContainer}>
                {imagePreview ? (
                  <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="person" size={48} color="#9ca3af" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={pickImage}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#6366f1" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={20} color="#6366f1" />
                      <Text style={styles.imagePickerText}>
                        {imagePreview ? 'Change Photo' : 'Add Photo'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Position *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.positionContainer}>
                    {positions.map((pos) => (
                      <TouchableOpacity
                        key={pos}
                        style={[
                          styles.positionChip,
                          position === pos && styles.positionChipSelected,
                        ]}
                        onPress={() => {
                          setPosition(pos);
                          if (!order) {
                            setOrder(hierarchyOrder[pos]?.toString() || '');
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.positionChipText,
                            position === pos && styles.positionChipTextSelected,
                          ]}
                        >
                          {pos}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Department</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Worship, Youth, Children"
                  value={department}
                  onChangeText={setDepartment}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+233 XX XXX XXXX"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Brief biography or description"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Office Hours</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Monday-Friday, 9 AM - 5 PM"
                  value={officeHours}
                  onChangeText={setOfficeHours}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Display Order (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Lower numbers appear first"
                  value={order}
                  onChangeText={setOrder}
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>
                  Leave empty to use default hierarchy order
                </Text>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {editMode ? 'Update Staff Member' : 'Add Staff Member'}
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
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  imagePickerText: {
    marginLeft: 8,
    color: '#6366f1',
    fontWeight: '500',
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
  positionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  positionChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  positionChipText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  positionChipTextSelected: {
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

