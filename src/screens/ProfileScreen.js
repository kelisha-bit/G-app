import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase.config';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    loadUserData();
    
    // Set up real-time listener for unread messages
    if (user) {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('toUserId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const unreadCount = snapshot.docs.filter(doc => !doc.data().read).length;
        setUnreadMessagesCount(unreadCount);
      }, (error) => {
        console.error('Error listening to messages:', error);
      });

      return () => unsubscribe();
    }
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setIsAdmin(data.role === 'admin');
      } else {
        // Fallback to auth data
        setUserData({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: 1,
      title: 'Check In',
      icon: 'checkbox-outline',
      color: '#10b981',
      screen: 'CheckIn',
    },
    {
      id: 2,
      title: 'Devotional',
      icon: 'book-outline',
      color: '#06b6d4',
      screen: 'Devotional',
    },
    {
      id: 3,
      title: 'Give',
      icon: 'heart-outline',
      color: '#ef4444',
      screen: 'Giving',
    },
    {
      id: 4,
      title: 'Departments',
      icon: 'business-outline',
      color: '#3b82f6',
      screen: 'Departments',
    },
    {
      id: 5,
      title: 'Ministries',
      icon: 'people-outline',
      color: '#8b5cf6',
      screen: 'Ministries',
    },
    {
      id: 6,
      title: 'Volunteer',
      icon: 'hand-right-outline',
      color: '#14b8a6',
      screen: 'Volunteer',
    },
    {
      id: 7,
      title: 'Directory',
      icon: 'call-outline',
      color: '#ec4899',
      screen: 'Directory',
    },
    {
      id: 8,
      title: 'Prayer',
      icon: 'hand-left-outline',
      color: '#8b5cf6',
      screen: 'Prayer',
    },
    {
      id: 9,
      title: 'Messages',
      icon: 'chatbubbles-outline',
      color: '#6366f1',
      screen: 'Messages',
    },
    {
      id: 10,
      title: 'My Activity',
      icon: 'stats-chart-outline',
      color: '#6366f1',
      screen: 'MyActivity',
    },
    {
      id: 11,
      title: 'Resources',
      icon: 'library-outline',
      color: '#f59e0b',
      screen: 'Resources',
    },
    {
      id: 12,
      title: 'Discipleship & Training',
      icon: 'school-outline',
      color: '#8b5cf6',
      screen: 'DiscipleshipTraining',
    },
  ];

  const settingsItems = [
    { id: 1, title: 'Edit Profile', icon: 'person-outline', screen: 'EditProfile' },
    { id: 2, title: 'Notifications', icon: 'notifications-outline', screen: 'Notifications' },
    { id: 3, title: 'Privacy', icon: 'lock-closed-outline', screen: 'Privacy' },
    { id: 4, title: 'Help & Support', icon: 'help-circle-outline', screen: 'HelpSupport' },
    { id: 5, title: 'About', icon: 'information-circle-outline', screen: 'About' },
  ];

  const handleSettingPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      if (Platform.OS === 'web') {
        window.alert(`${item.title} feature will be available soon!`);
      } else {
        Alert.alert('Coming Soon', `${item.title} feature will be available soon!`);
      }
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Use browser confirm dialog for web
      if (window.confirm('Are you sure you want to logout?')) {
        signOut(auth).catch((error) => {
          console.error('Logout error:', error);
          window.alert('Failed to logout. Please try again.');
        });
      }
    } else {
      // Use React Native Alert for mobile
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const displayName = userData?.displayName || user?.displayName || 'User';
  const photoURL = userData?.photoURL || user?.photoURL;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.profileSection}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={() => navigation.navigate(item.screen)}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={24} color="#fff" />
                  {item.screen === 'Messages' && unreadMessagesCount > 0 && (
                    <View style={styles.menuIconBadge}>
                      <Text style={styles.menuIconBadgeText}>
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.menuText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {settingsItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.settingItem}
              onPress={() => handleSettingPress(item)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name={item.icon} size={22} color="#6366f1" />
                <Text style={styles.settingText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Check if user is admin - show admin dashboard */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <LinearGradient
              colors={['#f59e0b', '#ef4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.adminGradient}
            >
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
              <Text style={styles.adminButtonText}>Admin Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
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
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '31%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  menuIconBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  menuIconBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuText: {
    fontSize: 11,
    color: '#4b5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 15,
    fontWeight: '500',
  },
  adminButton: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  adminGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    marginLeft: 10,
  },
});

