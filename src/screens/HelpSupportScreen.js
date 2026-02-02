import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function HelpSupportScreen({ navigation }) {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [contactMessage, setContactMessage] = useState('');

  const faqs = [
    {
      id: 1,
      question: 'How do I check in for a service?',
      answer:
        'Go to the Check In screen, select the service you\'re attending, and tap "Check In". You can check in for today\'s services or upcoming services.',
    },
    {
      id: 2,
      question: 'How do I submit a prayer request?',
      answer:
        'Navigate to the Prayer screen, tap "Submit Request", fill in the prayer title and details, and submit. You can choose to submit anonymously if you prefer.',
    },
    {
      id: 3,
      question: 'How do I give online?',
      answer:
        'Go to the Give screen, enter the amount you want to give, select a payment method, and complete the transaction. You can view your giving history anytime.',
    },
    {
      id: 4,
      question: 'How do I register for an event?',
      answer:
        'Go to the Events screen, find the event you want to attend, tap on it to view details, and then tap "Register" to sign up.',
    },
    {
      id: 5,
      question: 'How do I update my profile?',
      answer:
        'Go to the More tab, tap on your profile, then select "Edit Profile" to update your information, photo, and preferences.',
    },
    {
      id: 6,
      question: 'How do I join a ministry or department?',
      answer:
        'Navigate to the Departments or Ministries screen, browse available options, and tap "Join" on any ministry or department you\'re interested in.',
    },
    {
      id: 7,
      question: 'How do I volunteer?',
      answer:
        'Go to the Volunteer screen, browse available volunteer opportunities, and apply for positions that match your interests and availability.',
    },
    {
      id: 8,
      question: 'How do I contact church leadership?',
      answer:
        'You can send a message through the Messages screen, or use the contact information provided in the Directory or About sections.',
    },
  ];

  const supportOptions = [
    {
      id: 1,
      title: 'AI Assistant',
      description: 'Chat with our AI assistant for instant help',
      icon: 'chatbubbles-outline',
      color: '#8b5cf6',
      action: () => {
        navigation.navigate('ChatBot');
      },
    },
    {
      id: 2,
      title: 'Email Support',
      description: 'Send us an email and we\'ll get back to you',
      icon: 'mail-outline',
      color: '#6366f1',
      action: () => {
        Linking.openURL('mailto:support@greaterworkscitychurch.org?subject=App Support Request').catch((err) =>
          console.error('Error opening email:', err)
        );
      },
    },
    {
      id: 3,
      title: 'Call Us',
      description: 'Speak with someone directly',
      icon: 'call-outline',
      color: '#10b981',
      action: () => {
        Linking.openURL('tel:+1234567890').catch((err) =>
          console.error('Error opening phone:', err)
        );
      },
    },
    {
      id: 4,
      title: 'Visit Us',
      description: 'Come to our church office',
      icon: 'location-outline',
      color: '#f59e0b',
      action: () => {
        Alert.alert(
          'Visit Us',
          'Greater Works City Church\n123 Church Street\nCity, State 12345\n\nOffice Hours: Monday-Friday, 9 AM - 5 PM',
          [{ text: 'OK' }]
        );
      },
    },
    {
      id: 5,
      title: 'Report a Bug',
      description: 'Found an issue? Let us know',
      icon: 'bug-outline',
      color: '#ef4444',
      action: () => {
        Alert.alert(
          'Report a Bug',
          'Please send us an email describing the issue you encountered.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send Email',
              onPress: () => {
                Linking.openURL(
                  'mailto:support@greaterworkscitychurch.org?subject=Bug Report'
                ).catch((err) => console.error('Error opening email:', err));
              },
            },
          ]
        );
      },
    },
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    Linking.openURL(
      `mailto:support@greaterworkscitychurch.org?subject=Support Request&body=${encodeURIComponent(contactMessage)}`
    ).catch((err) => console.error('Error opening email:', err));

    Alert.alert('Message Sent', 'We\'ll get back to you soon!');
    setContactMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.infoCard}>
          <Ionicons name="help-circle" size={32} color="#8b5cf6" />
          <Text style={styles.infoTitle}>We're Here to Help</Text>
          <Text style={styles.infoText}>
            Find answers to common questions or get in touch with our support team
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqCard}
              onPress={() => toggleFAQ(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6366f1"
                />
              </View>
              {expandedFAQ === faq.id && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <View style={styles.supportGrid}>
            {supportOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.supportCard}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={[styles.supportIcon, { backgroundColor: option.color }]}>
                  <Ionicons name={option.icon} size={28} color="#fff" />
                </View>
                <Text style={styles.supportTitle}>{option.title}</Text>
                <Text style={styles.supportDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Us a Message</Text>
          <View style={styles.messageCard}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              placeholderTextColor="#9ca3af"
              value={contactMessage}
              onChangeText={setContactMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendGradient}
              >
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.sendButtonText}>Send Message</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="time-outline" size={24} color="#6366f1" />
          <Text style={styles.tipText}>
            Our support team typically responds within 24-48 hours. For urgent matters, please call us directly.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  scrollContent: {
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
    marginBottom: 15,
  },
  faqCard: {
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
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 10,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  supportCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  supportDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  messageCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 120,
    marginBottom: 15,
  },
  sendButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#ede9fe',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#4c1d95',
    lineHeight: 18,
    marginLeft: 12,
  },
});

