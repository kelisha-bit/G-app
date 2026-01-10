import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase.config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public', // public, members, private
    showEmail: true,
    showPhone: false,
    allowDirectoryListing: true,
    showAttendance: false,
    showGivingHistory: false,
  });

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.privacySettings) {
          setPrivacySettings({
            ...privacySettings,
            ...userData.privacySettings,
          });
        }
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const newSettings = {
      ...privacySettings,
      [key]: !privacySettings[key],
    };
    setPrivacySettings(newSettings);

    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          privacySettings: newSettings,
        });
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
      setPrivacySettings(privacySettings);
    }
  };

  const handleProfileVisibilityChange = async (visibility) => {
    const newSettings = {
      ...privacySettings,
      profileVisibility: visibility,
    };
    setPrivacySettings(newSettings);

    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          privacySettings: newSettings,
        });
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
    }
  };

  const privacyOptions = [
    {
      title: 'Show Email',
      description: 'Allow others to see your email address',
      key: 'showEmail',
      icon: 'mail',
    },
    {
      title: 'Show Phone Number',
      description: 'Allow others to see your phone number',
      key: 'showPhone',
      icon: 'call',
    },
    {
      title: 'Directory Listing',
      description: 'Include your profile in the church directory',
      key: 'allowDirectoryListing',
      icon: 'people',
    },
    {
      title: 'Show Attendance',
      description: 'Allow others to see your attendance history',
      key: 'showAttendance',
      icon: 'checkbox',
    },
    {
      title: 'Show Giving History',
      description: 'Allow church administrators to see your giving history',
      key: 'showGivingHistory',
      icon: 'heart',
    },
  ];

  const openPrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Would you like to view our privacy policy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View',
          onPress: () => {
            // You can replace this with your actual privacy policy URL
            Linking.openURL('https://example.com/privacy-policy').catch((err) =>
              console.error('Error opening URL:', err)
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="lock-closed" size={32} color="#8b5cf6" />
          <Text style={styles.infoTitle}>Your Privacy Matters</Text>
          <Text style={styles.infoText}>
            Control who can see your information and how it's shared
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          <Text style={styles.sectionDescription}>
            Choose who can view your profile
          </Text>
          <View style={styles.visibilityOptions}>
            {[
              { value: 'public', label: 'Public', desc: 'Everyone can see your profile' },
              { value: 'members', label: 'Members Only', desc: 'Only church members can see' },
              { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.visibilityOption,
                  privacySettings.profileVisibility === option.value &&
                    styles.visibilityOptionActive,
                ]}
                onPress={() => handleProfileVisibilityChange(option.value)}
              >
                <View style={styles.visibilityOptionContent}>
                  <Text
                    style={[
                      styles.visibilityOptionLabel,
                      privacySettings.profileVisibility === option.value &&
                        styles.visibilityOptionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.visibilityOptionDesc,
                      privacySettings.profileVisibility === option.value &&
                        styles.visibilityOptionDescActive,
                    ]}
                  >
                    {option.desc}
                  </Text>
                </View>
                {privacySettings.profileVisibility === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information Sharing</Text>
          <Text style={styles.sectionDescription}>
            Control what information is visible to others
          </Text>
          {privacyOptions.map((option) => (
            <View key={option.key} style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={option.icon} size={22} color="#6366f1" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{option.title}</Text>
                  <Text style={styles.settingDescription}>
                    {option.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={privacySettings[option.key]}
                onValueChange={() => handleToggle(option.key)}
                trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.policyButton} onPress={openPrivacyPolicy}>
          <Ionicons name="document-text-outline" size={20} color="#6366f1" />
          <Text style={styles.policyButtonText}>View Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#10b981" />
          <Text style={styles.tipText}>
            Your data is encrypted and secure. We never share your information with third parties without your consent.
          </Text>
        </View>

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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
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
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
  visibilityOptions: {
    gap: 10,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  visibilityOptionActive: {
    borderColor: '#6366f1',
    backgroundColor: '#ede9fe',
  },
  visibilityOptionContent: {
    flex: 1,
  },
  visibilityOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  visibilityOptionLabelActive: {
    color: '#6366f1',
  },
  visibilityOptionDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  visibilityOptionDescActive: {
    color: '#6366f1',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  policyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  policyButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#065f46',
    lineHeight: 18,
    marginLeft: 12,
  },
});

