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
  TextInput,
  Modal,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebase.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ageGroups = [
  {
    id: 'nursery',
    name: 'Nursery',
    ageRange: '0-2 years',
    icon: 'heart',
    color: '#ec4899',
    description: 'Safe, loving care for our littlest ones',
    schedule: 'Sundays, 9:00 AM & 11:00 AM',
    location: 'Nursery Wing, Room 101',
  },
  {
    id: 'preschool',
    name: 'Preschool',
    ageRange: '3-5 years',
    icon: 'happy',
    color: '#f59e0b',
    description: 'Fun, interactive Bible stories and activities',
    schedule: 'Sundays, 9:00 AM & 11:00 AM',
    location: 'Children\'s Wing, Room 201',
  },
  {
    id: 'elementary',
    name: 'Elementary',
    ageRange: '6-11 years',
    icon: 'school',
    color: '#10b981',
    description: 'Engaging lessons, worship, and games',
    schedule: 'Sundays, 9:00 AM & 11:00 AM',
    location: 'Children\'s Wing, Room 301-303',
  },
  {
    id: 'preteens',
    name: 'Pre-Teens',
    ageRange: '12-13 years',
    icon: 'people',
    color: '#6366f1',
    description: 'Preparing for youth ministry with relevant teaching',
    schedule: 'Sundays, 9:00 AM & 11:00 AM',
    location: 'Youth Wing, Room 401',
  },
];

export default function FamilyMinistryScreen({ navigation, route }) {
  // Ensure route object has expected structure for React Navigation
  const safeRoute = route || { params: {}, index: 0 };
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [childrenEvents, setChildrenEvents] = useState([]);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(null);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [myChildren, setMyChildren] = useState([]);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadChildrenEvents(),
        loadMyChildren(),
        loadResources(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const loadChildrenEvents = async () => {
    try {
      // Get all events and filter in memory to avoid index requirement
      const eventsQuery = query(collection(db, 'events'));
      const snapshot = await getDocs(eventsQuery);
      const events = [];
      const today = new Date().toISOString().split('T')[0];

      snapshot.forEach((doc) => {
        const event = doc.data();
        // Filter for children/family events and future dates
        if (
          event.date >= today &&
          (event.category === 'Youth' ||
            event.category === 'Other' ||
            event.title?.toLowerCase().includes('children') ||
            event.title?.toLowerCase().includes('kids') ||
            event.title?.toLowerCase().includes('family') ||
            event.title?.toLowerCase().includes('vbs') ||
            event.title?.toLowerCase().includes('vacation bible'))
        ) {
          events.push({
            id: doc.id,
            ...event,
          });
        }
      });

      // Sort by date
      events.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });

      // Fallback sample data
      if (events.length === 0) {
        events.push({
          id: '1',
          title: 'Vacation Bible School 2025',
          date: '2025-07-15',
          time: '9:00 AM - 12:00 PM',
          location: 'Children\'s Wing',
          category: 'Youth',
          description: 'A week-long adventure for kids to learn about God\'s love through fun activities, games, and Bible stories.',
        });
      }

      setChildrenEvents(events.slice(0, 5));
    } catch (error) {
      console.error('Error loading children events:', error);
      setChildrenEvents([]);
    }
  };

  const loadMyChildren = async () => {
    try {
      if (!auth.currentUser) {
        setMyChildren([]);
        return;
      }

      // Query without orderBy to avoid index requirement, then sort in memory
      const childrenQuery = query(
        collection(db, 'childrenCheckIns'),
        where('parentId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(childrenQuery);
      const children = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Double-check permission (should be handled by rules, but just in case)
        if (data.parentId === auth.currentUser.uid) {
          children.push({
            id: doc.id,
            ...data,
          });
        }
      });

      // Sort by checkedInAt descending, then by childName ascending
      children.sort((a, b) => {
        const dateA = new Date(a.checkedInAt || 0);
        const dateB = new Date(b.checkedInAt || 0);
        if (dateB.getTime() !== dateA.getTime()) {
          return dateB - dateA;
        }
        return (a.childName || '').localeCompare(b.childName || '');
      });

      // Group by child name (keep most recent for each child)
      const grouped = {};
      children.forEach((child) => {
        if (!grouped[child.childName]) {
          grouped[child.childName] = child;
        }
      });

      setMyChildren(Object.values(grouped));
    } catch (error) {
      console.error('Error loading my children:', error);
      // If permission error, collection might not exist yet - that's okay
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        console.log('Permission denied - collection may not exist yet or rules need deployment');
      }
      setMyChildren([]);
    }
  };

  const loadResources = async () => {
    try {
      // Get all resources and sort in memory to avoid index requirement
      const resourcesQuery = query(collection(db, 'parentResources'));
      const snapshot = await getDocs(resourcesQuery);
      const resourcesData = [];

      snapshot.forEach((doc) => {
        resourcesData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by createdAt descending
      resourcesData.sort((a, b) => {
        const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
        const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || 0);
        return dateB - dateA;
      });

      // Fallback sample resources
      if (resourcesData.length === 0) {
        resourcesData.push(
          {
            id: '1',
            title: 'Parenting with Purpose',
            type: 'Article',
            description: 'Biblical principles for raising children in faith',
            url: 'https://example.com/parenting',
          },
          {
            id: '2',
            title: 'Family Devotion Guide',
            type: 'PDF',
            description: 'Daily devotion ideas for families',
            url: 'https://example.com/devotions',
          },
          {
            id: '3',
            title: 'Safety & Security Policy',
            type: 'Document',
            description: 'Our commitment to child safety',
            url: 'https://example.com/safety',
          }
        );
      }

      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading resources:', error);
      // If permission error, use fallback resources
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        console.log('Permission denied - using fallback resources');
        setResources([
          {
            id: '1',
            title: 'Parenting with Purpose',
            type: 'Article',
            description: 'Biblical principles for raising children in faith',
            url: 'https://example.com/parenting',
          },
          {
            id: '2',
            title: 'Family Devotion Guide',
            type: 'PDF',
            description: 'Daily devotion ideas for families',
            url: 'https://example.com/devotions',
          },
          {
            id: '3',
            title: 'Safety & Security Policy',
            type: 'Document',
            description: 'Our commitment to child safety',
            url: 'https://example.com/safety',
          },
        ]);
      } else {
        setResources([]);
      }
    }
  };

  const handleCheckIn = async () => {
    if (!selectedAgeGroup || !childName.trim() || !childAge.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setCheckingIn(true);
    try {
      const ageGroup = ageGroups.find((g) => g.id === selectedAgeGroup);
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      const checkInData = {
        parentId: auth.currentUser.uid,
        parentName: parentName.trim() || userData.displayName || auth.currentUser.displayName || 'Parent',
        parentEmail: auth.currentUser.email,
        parentPhone: parentPhone.trim() || userData.phone || '',
        childName: childName.trim(),
        childAge: childAge.trim(),
        ageGroup: selectedAgeGroup,
        ageGroupName: ageGroup.name,
        specialNeeds: specialNeeds.trim() || '',
        checkedInAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        serviceTime: ageGroup.schedule,
        location: ageGroup.location,
        pickupCode: Math.floor(1000 + Math.random() * 9000).toString(), // 4-digit code
      };

      await addDoc(collection(db, 'childrenCheckIns'), checkInData);

      Alert.alert(
        '✅ Check-In Successful!',
        `${childName} has been checked in to ${ageGroup.name}.\n\nPickup Code: ${checkInData.pickupCode}\n\nPlease keep this code safe. You'll need it to pick up your child.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCheckInModalVisible(false);
              resetCheckInForm();
              loadMyChildren();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Check-in error:', error);
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const resetCheckInForm = () => {
    setSelectedAgeGroup(null);
    setChildName('');
    setChildAge('');
    setParentName('');
    setParentPhone('');
    setSpecialNeeds('');
  };

  const openResource = (resource) => {
    if (resource.url) {
      Linking.openURL(resource.url).catch((err) => {
        Alert.alert('Error', 'Could not open resource. Please contact the church office.');
      });
    }
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Welcome to Children's Ministry</Text>
        <Text style={styles.sectionDescription}>
          We're committed to providing a safe, fun, and nurturing environment where children can learn about God's love and grow in their faith.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Age Groups</Text>
        {ageGroups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={styles.ageGroupCard}
            onPress={() => {
              setSelectedAgeGroup(group.id);
              setCheckInModalVisible(true);
            }}
          >
            <LinearGradient
              colors={[`${group.color}20`, `${group.color}10`]}
              style={styles.ageGroupGradient}
            >
              <View style={[styles.ageGroupIcon, { backgroundColor: `${group.color}20` }]}>
                <Ionicons name={group.icon} size={32} color={group.color} />
              </View>
              <View style={styles.ageGroupContent}>
                <Text style={styles.ageGroupName}>{group.name}</Text>
                <Text style={styles.ageGroupRange}>{group.ageRange}</Text>
                <Text style={styles.ageGroupDescription}>{group.description}</Text>
                <View style={styles.ageGroupDetails}>
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text style={styles.ageGroupDetailText}>{group.schedule}</Text>
                </View>
                <View style={styles.ageGroupDetails}>
                  <Ionicons name="location-outline" size={14} color="#6b7280" />
                  <Text style={styles.ageGroupDetailText}>{group.location}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={group.color} />
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Events')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {childrenEvents.length > 0 ? (
          childrenEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
            >
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.eventDetails}>
                  <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                  <Text style={styles.eventDetailText}>
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  {event.time && (
                    <>
                      <Ionicons name="time-outline" size={14} color="#6b7280" style={styles.eventIcon} />
                      <Text style={styles.eventDetailText}>{event.time}</Text>
                    </>
                  )}
                </View>
                {event.description && (
                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {event.description}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No upcoming events</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety & Security</Text>
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={32} color="#10b981" />
          <View style={styles.safetyContent}>
            <Text style={styles.safetyTitle}>Your Child's Safety is Our Priority</Text>
            <Text style={styles.safetyText}>
              • All volunteers are background checked{'\n'}
              • Secure check-in/check-out system{'\n'}
              • Age-appropriate environments{'\n'}
              • Emergency procedures in place{'\n'}
              • Parent pickup codes required
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderCheckIn = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Check-In Your Child</Text>
        <Text style={styles.sectionDescription}>
          Check in your child for Sunday services or special events. You'll receive a pickup code for security.
        </Text>
      </View>

      {myChildren.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Children</Text>
          {myChildren.map((child) => (
            <View key={child.id} style={styles.myChildCard}>
              <View style={styles.myChildContent}>
                <Ionicons name="person" size={24} color="#6366f1" />
                <View style={styles.myChildInfo}>
                  <Text style={styles.myChildName}>{child.childName}</Text>
                  <Text style={styles.myChildDetails}>
                    {child.ageGroupName} • Age {child.childAge}
                  </Text>
                  <Text style={styles.myChildDate}>
                    Last checked in: {new Date(child.checkedInAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.checkInButton}
        onPress={() => {
          setSelectedAgeGroup(null);
          setCheckInModalVisible(true);
        }}
      >
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.checkInButtonGradient}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.checkInButtonText}>Check In New Child</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderResources = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parent Resources</Text>
        <Text style={styles.sectionDescription}>
          Helpful resources to support you in raising children with faith and purpose.
        </Text>
      </View>

      {resources.length > 0 ? (
        resources.map((resource) => (
          <TouchableOpacity
            key={resource.id}
            style={styles.resourceCard}
            onPress={() => openResource(resource)}
          >
            <View style={styles.resourceIcon}>
              <Ionicons
                name={
                  resource.type === 'PDF'
                    ? 'document-text'
                    : resource.type === 'Video'
                    ? 'play-circle'
                    : 'book'
                }
                size={24}
                color="#6366f1"
              />
            </View>
            <View style={styles.resourceContent}>
              <View style={styles.resourceHeader}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <View style={styles.resourceTypeBadge}>
                  <Text style={styles.resourceTypeText}>{resource.type}</Text>
                </View>
              </View>
              {resource.description && (
                <Text style={styles.resourceDescription}>{resource.description}</Text>
              )}
            </View>
            <Ionicons name="open-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyStateText}>No resources available</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderVolunteer = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Volunteer Opportunities</Text>
        <Text style={styles.sectionDescription}>
          Join our team and make a difference in children's lives. All volunteers must complete a background check.
        </Text>
      </View>

      <View style={styles.volunteerCard}>
        <Ionicons name="people" size={32} color="#6366f1" />
        <Text style={styles.volunteerTitle}>Serve in Children's Ministry</Text>
        <Text style={styles.volunteerDescription}>
          We're always looking for caring adults to serve our children. Opportunities include:
        </Text>
        <View style={styles.volunteerList}>
          <Text style={styles.volunteerItem}>• Sunday School Teachers</Text>
          <Text style={styles.volunteerItem}>• Children's Worship Leaders</Text>
          <Text style={styles.volunteerItem}>• Activity Coordinators</Text>
          <Text style={styles.volunteerItem}>• Nursery Caregivers</Text>
          <Text style={styles.volunteerItem}>• Special Events Helpers</Text>
        </View>
        <TouchableOpacity
          style={styles.volunteerButton}
          onPress={() => navigation.navigate('Volunteer')}
        >
          <Text style={styles.volunteerButtonText}>View Volunteer Opportunities</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Family Ministry</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        {[
          { id: 'overview', label: 'Overview', icon: 'home' },
          { id: 'checkin', label: 'Check-In', icon: 'checkmark-circle' },
          { id: 'resources', label: 'Resources', icon: 'book' },
          { id: 'volunteer', label: 'Volunteer', icon: 'people' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? '#6366f1' : '#6b7280'}
            />
            <Text
              style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'checkin' && renderCheckIn()}
          {activeTab === 'resources' && renderResources()}
          {activeTab === 'volunteer' && renderVolunteer()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Check-In Modal */}
      <Modal
        visible={checkInModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCheckInModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Check-In Child</Text>
              <TouchableOpacity onPress={() => setCheckInModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Select Age Group *</Text>
                <View style={styles.ageGroupSelector}>
                  {ageGroups.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      style={[
                        styles.ageGroupOption,
                        selectedAgeGroup === group.id && styles.ageGroupOptionActive,
                        selectedAgeGroup === group.id && {
                          borderColor: group.color,
                          backgroundColor: `${group.color}10`,
                        },
                      ]}
                      onPress={() => setSelectedAgeGroup(group.id)}
                    >
                      <Ionicons
                        name={group.icon}
                        size={20}
                        color={selectedAgeGroup === group.id ? group.color : '#6b7280'}
                      />
                      <Text
                        style={[
                          styles.ageGroupOptionText,
                          selectedAgeGroup === group.id && {
                            color: group.color,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {group.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Child's Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={childName}
                  onChangeText={setChildName}
                  placeholder="Enter child's name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Child's Age *</Text>
                <TextInput
                  style={styles.formInput}
                  value={childAge}
                  onChangeText={setChildAge}
                  placeholder="e.g., 5 years"
                  keyboardType="default"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Parent/Guardian Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={parentName}
                  onChangeText={setParentName}
                  placeholder="Your name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={parentPhone}
                  onChangeText={setParentPhone}
                  placeholder="+233 XX XXX XXXX"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Special Needs or Allergies</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={specialNeeds}
                  onChangeText={setSpecialNeeds}
                  placeholder="Any special needs, allergies, or important information"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCheckInModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, checkingIn && styles.modalSubmitButtonDisabled]}
                onPress={handleCheckIn}
                disabled={checkingIn}
              >
                {checkingIn ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Check In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </KeyboardAvoidingView>
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
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabLabel: {
    marginLeft: 6,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  ageGroupCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ageGroupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  ageGroupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ageGroupContent: {
    flex: 1,
  },
  ageGroupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  ageGroupRange: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  ageGroupDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  ageGroupDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ageGroupDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  eventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
    marginRight: 12,
  },
  eventIcon: {
    marginLeft: 12,
  },
  eventDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  safetyCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  safetyContent: {
    flex: 1,
    marginLeft: 12,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  myChildCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  myChildContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myChildInfo: {
    flex: 1,
    marginLeft: 12,
  },
  myChildName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  myChildDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  myChildDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  checkInButton: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  resourceTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  resourceTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  resourceDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  volunteerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  volunteerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  volunteerDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  volunteerList: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  volunteerItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  volunteerButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  volunteerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
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
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  ageGroupSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ageGroupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    marginRight: 8,
    marginBottom: 8,
  },
  ageGroupOptionActive: {
    borderWidth: 2,
  },
  ageGroupOptionText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

