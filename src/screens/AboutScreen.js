import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function AboutScreen({ navigation }) {
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

  const aboutItems = [
    {
      id: 1,
      title: 'Our Mission',
      description:
        'Greater Works City Church is committed to building faith and changing lives through the power of God\'s word, prayer, and community fellowship.',
      icon: 'heart',
    },
    {
      id: 2,
      title: 'Our Vision',
      description:
        'To be a church that transforms lives, impacts communities, and spreads the gospel of Jesus Christ to all nations.',
      icon: 'eye',
    },
    {
      id: 3,
      title: 'Our Values',
      description:
        'Faith, Love, Integrity, Excellence, and Service - these core values guide everything we do as a church family.',
      icon: 'star',
    },
  ];

  const contactInfo = [
    {
      id: 1,
      title: 'Address',
      value: '123 Faith Avenue, Greater Works City\nJoma Accra, Ghana',
      icon: 'location',
      action: () => {
        Linking.openURL('https://maps.google.com/?q=123+Faith+Avenue,+Greater+Works+City,+Joma+Accra,+Ghana').catch((err) =>
          console.error('Error opening maps:', err)
        );
      },
    },
    {
      id: 2,
      title: 'Phone',
      value: '+233 536348894',
      icon: 'call',
      action: () => {
        Linking.openURL('tel:+233536348894').catch((err) =>
          console.error('Error opening phone:', err)
        );
      },
    },
    {
      id: 3,
      title: 'Email',
      value: 'info@greaterworkscitychurch.org',
      icon: 'mail',
      action: () => {
        Linking.openURL('mailto:info@greaterworkscitychurch.org').catch((err) =>
          console.error('Error opening email:', err)
        );
      },
    },
    {
      id: 4,
      title: 'Website',
      value: 'www.greaterworkscitychurch.org',
      icon: 'globe',
      action: () => {
        Linking.openURL('https://www.greaterworkscitychurch.org').catch((err) =>
          console.error('Error opening website:', err)
        );
      },
    },
  ];

  const socialLinks = [
    {
      id: 1,
      name: 'Facebook',
      icon: 'logo-facebook',
      color: '#1877f2',
      url: 'https://facebook.com/greaterworkscitychurch',
    },
    {
      id: 2,
      name: 'Instagram',
      icon: 'logo-instagram',
      color: '#e4405f',
      url: 'https://instagram.com/greaterworkscitychurch',
    },
    {
      id: 3,
      name: 'YouTube',
      icon: 'logo-youtube',
      color: '#ff0000',
      url: 'https://youtube.com/greaterworkscitychurch',
    },
    {
      id: 4,
      name: 'Twitter',
      icon: 'logo-twitter',
      color: '#1da1f2',
      url: 'https://twitter.com/greaterworkscitychurch',
    },
  ];

  const openLink = (url) => {
    Linking.openURL(url).catch((err) => console.error('Error opening link:', err));
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
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.churchName}>Greater Works City Church</Text>
          <Text style={styles.churchTagline}>Building Faith, Changing Lives</Text>
        </View>

        <View style={styles.section}>
          {aboutItems.map((item) => (
            <View key={item.id} style={styles.aboutCard}>
              <View style={styles.aboutIconContainer}>
                <Ionicons name={item.icon} size={28} color="#6366f1" />
              </View>
              <View style={styles.aboutContent}>
                <Text style={styles.aboutTitle}>{item.title}</Text>
                <Text style={styles.aboutDescription}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {contactInfo.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.contactCard}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={styles.contactLeft}>
                <View style={styles.contactIconContainer}>
                  <Ionicons name={item.icon} size={22} color="#6366f1" />
                </View>
                <View style={styles.contactTextContainer}>
                  <Text style={styles.contactTitle}>{item.title}</Text>
                  <Text style={styles.contactValue}>{item.value}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <View style={styles.socialGrid}>
            {socialLinks.map((social) => (
              <TouchableOpacity
                key={social.id}
                style={styles.socialCard}
                onPress={() => openLink(social.url)}
                activeOpacity={0.7}
              >
                <Ionicons name={social.icon} size={32} color={social.color} />
                <Text style={styles.socialName}>{social.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Times</Text>
          <View style={styles.serviceCard}>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceDay}>Sunday</Text>
              <Text style={styles.serviceTime}>8:00 AM - 10:30 AM</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceDay}>Wednesday</Text>
              <Text style={styles.serviceTime}>9:00 AM - 1:00 PM</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceDay}>Friday</Text>
              <Text style={styles.serviceTime}>6:30 PM - 8:30 PM</Text>
            </View>
          </View>
        </View>

        <View style={styles.appInfoCard}>
          <Text style={styles.appInfoTitle}>App Information</Text>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Version:</Text>
            <Text style={styles.appInfoValue}>{appVersion}</Text>
          </View>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Build:</Text>
            <Text style={styles.appInfoValue}>{buildNumber}</Text>
          </View>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Platform:</Text>
            <Text style={styles.appInfoValue}>{Platform.OS}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Greater Works City Church
          </Text>
          <Text style={styles.footerText}>All rights reserved</Text>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  churchName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  churchTagline: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  aboutCard: {
    flexDirection: 'row',
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
  aboutIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  aboutContent: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  contactCard: {
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
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 20,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  socialCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 10,
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serviceDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  serviceTime: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '500',
  },
  appInfoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  appInfoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  appInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
});

