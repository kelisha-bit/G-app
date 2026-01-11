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
} from 'firebase/firestore';

export default function ManageResourcesScreen({ navigation }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('pdf');
  const [category, setCategory] = useState('Teaching');
  const [url, setUrl] = useState('');

  const types = ['pdf', 'audio', 'video', 'book', 'link'];
  const categories = ['Teaching', 'Forms', 'Guides', 'Books', 'Audio', 'Video', 'Links'];

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const resourcesList = [];
      
      querySnapshot.forEach((doc) => {
        resourcesList.push({ id: doc.id, ...doc.data() });
      });
      
      setResources(resourcesList);
    } catch (error) {
      console.error('Error loading resources:', error);
      Alert.alert('Error', 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (resource) => {
    setEditMode(true);
    setSelectedResource(resource);
    setTitle(resource.title || '');
    setDescription(resource.description || '');
    setType(resource.type || 'pdf');
    setCategory(resource.category || 'Teaching');
    setUrl(resource.url || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('pdf');
    setCategory('Teaching');
    setUrl('');
    setSelectedResource(null);
  };

  const handleSave = async () => {
    if (!title || !url) {
      Alert.alert('Validation Error', 'Please fill in title and URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      Alert.alert('Validation Error', 'Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    try {
      const resourceData = {
        title: title.trim(),
        description: description.trim(),
        type: type,
        category: category,
        url: url.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (editMode && selectedResource) {
        await updateDoc(doc(db, 'resources', selectedResource.id), resourceData);
        Alert.alert('Success', 'Resource updated successfully');
      } else {
        await addDoc(collection(db, 'resources'), {
          ...resourceData,
          createdAt: new Date().toISOString(),
          downloads: 0,
        });
        Alert.alert('Success', 'Resource created successfully');
      }

      setModalVisible(false);
      resetForm();
      loadResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      Alert.alert('Error', 'Failed to save resource');
    }
  };

  const handleDelete = (resource) => {
    Alert.alert(
      'Delete Resource',
      `Are you sure you want to delete "${resource.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'resources', resource.id));
              Alert.alert('Success', 'Resource deleted successfully');
              loadResources();
            } catch (error) {
              console.error('Error deleting resource:', error);
              Alert.alert('Error', 'Failed to delete resource');
            }
          },
        },
      ]
    );
  };

  const getResourceIcon = (resourceType) => {
    switch (resourceType) {
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

  const getResourceColor = (resourceType) => {
    switch (resourceType) {
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

  const renderResourceCard = (resource) => {
    const iconName = getResourceIcon(resource.type);
    const iconColor = getResourceColor(resource.type);

    return (
      <View key={resource.id} style={styles.resourceCard}>
        <View style={styles.resourceHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={iconName} size={24} color={iconColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.resourceTitle}>{resource.title}</Text>
            <View style={styles.resourceMeta}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{resource.category}</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: `${iconColor}15` }]}>
                <Text style={[styles.typeText, { color: iconColor }]}>
                  {resource.type?.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.resourceActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(resource)}>
              <Ionicons name="create-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(resource)}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {resource.description && (
          <Text style={styles.resourceDescription} numberOfLines={2}>
            {resource.description}
          </Text>
        )}

        <View style={styles.resourceFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="download-outline" size={14} color="#9ca3af" />
            <Text style={styles.footerText}>
              {resource.downloads || 0} {resource.downloads === 1 ? 'download' : 'downloads'}
            </Text>
          </View>
          <Text style={styles.resourceDate}>
            {resource.createdAt
              ? new Date(resource.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recently'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resources</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{resources.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {resources.filter(r => r.type === 'pdf').length}
          </Text>
          <Text style={styles.statLabel}>PDFs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#6366f1' }]}>
            {resources.filter(r => r.type === 'video').length}
          </Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {resources.reduce((sum, r) => sum + (r.downloads || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Downloads</Text>
        </View>
      </View>

      {/* Resources List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading resources...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {resources.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No resources yet</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Text style={styles.emptyButtonText}>Create First Resource</Text>
              </TouchableOpacity>
            </View>
          ) : (
            resources.map(renderResourceCard)
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Resource' : 'Create Resource'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter resource title"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter resource description..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>URL *</Text>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://example.com/resource.pdf"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {types.map((t) => {
                  const iconColor = getResourceColor(t);
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeButton,
                        type === t && styles.typeButtonActive,
                        type === t && { backgroundColor: iconColor, borderColor: iconColor },
                        !(type === t) && { borderColor: '#e5e7eb' },
                      ]}
                      onPress={() => setType(t)}
                    >
                      <Ionicons
                        name={getResourceIcon(t)}
                        size={20}
                        color={type === t ? '#fff' : iconColor}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>
                        {t.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryButtonText, category === cat && styles.categoryButtonTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="save-outline" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Update Resource' : 'Create Resource'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  addButton: {
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 10,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resourceCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resourceActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  resourceDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContent: {
    flex: 1,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 2,
  },
  typeButtonActive: {
    borderWidth: 2,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
});

