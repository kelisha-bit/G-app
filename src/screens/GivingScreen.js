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
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase.config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initiateMobileMoneyPayment, isPaymentServiceConfigured } from '../utils/paymentService';

export default function GivingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tithe');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Mobile Money');
  const [selectedMobileMoneyProvider, setSelectedMobileMoneyProvider] = useState('MTN');
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [givingStats, setGivingStats] = useState({ total: 0, count: 0 });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const quickAmounts = [50, 100, 200, 500];
  const categories = ['Tithe', 'Offering', 'Building Fund', 'Missions', 'Special'];
  const paymentMethods = [
    { id: 'cash', name: 'Cash', subtitle: 'Pay with cash at church', icon: 'cash' },
    { id: 'momo', name: 'Mobile Money', subtitle: 'MTN, Vodafone, AirtelTigo', icon: 'phone-portrait' },
    { id: 'card', name: 'Card Payment', subtitle: 'Visa, Mastercard', icon: 'card' },
    { id: 'bank', name: 'Bank Transfer', subtitle: 'Direct bank transfer', icon: 'business' },
  ];
  const mobileMoneyProviders = [
    { id: 'MTN', name: 'MTN Mobile Money', code: '024', color: '#FFCC00' },
    { id: 'Vodafone', name: 'Vodafone Cash', code: '020', color: '#E60000' },
    { id: 'AirtelTigo', name: 'AirtelTigo Money', code: '027', color: '#FF0000' },
  ];

  useEffect(() => {
    loadGivingStats();
  }, []);

  const loadGivingStats = async () => {
    try {
      setStatsLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      // Get current year start
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);

      // Query donations for current user this year
      const donationsRef = collection(db, 'donations');
      const q = query(
        donationsRef,
        where('userId', '==', user.uid),
        where('createdAt', '>=', Timestamp.fromDate(yearStart)),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      let total = 0;
      let count = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'completed' || data.status === 'pending') {
          total += data.amount;
          count++;
        }
      });

      setGivingStats({ total, count });
    } catch (error) {
      console.error('Error loading giving stats:', error);
      // Set default stats if error
      setGivingStats({ total: 0, count: 0 });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleGiveNow = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    // Validate mobile money details if Mobile Money is selected
    if (selectedPaymentMethod === 'Mobile Money') {
      if (!mobileMoneyPhone || mobileMoneyPhone.trim() === '') {
        Alert.alert('Error', 'Please enter your mobile money phone number');
        return;
      }
      // Validate phone number format (Ghana numbers: 10 digits starting with 0, or 9 digits without 0)
      const phoneRegex = /^(0)?[0-9]{9}$/;
      const cleanPhone = mobileMoneyPhone.replace(/\s+/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        Alert.alert('Error', 'Please enter a valid Ghana phone number (e.g., 0244123456 or 244123456)');
        return;
      }
    }
    
    setShowConfirmModal(true);
  };

  const processDonation = async () => {
    try {
      setLoading(true);
      setShowConfirmModal(false);
      
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to give');
        return;
      }

      const amount = selectedAmount || parseFloat(customAmount);

      // Create donation record
      const donationData = {
        userId: user.uid,
        userEmail: user.email,
        amount: amount,
        category: selectedCategory,
        paymentMethod: selectedPaymentMethod,
        status: 'pending', // pending, completed, failed
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      };

      // Add mobile money specific details
      if (selectedPaymentMethod === 'Mobile Money') {
        donationData.mobileMoneyProvider = selectedMobileMoneyProvider;
        donationData.mobileMoneyPhone = mobileMoneyPhone.replace(/\s+/g, '');
      }

      const docRef = await addDoc(collection(db, 'donations'), donationData);

      // Process payment based on method
      if (selectedPaymentMethod === 'Mobile Money') {
        // Check if payment service is configured
        const isConfigured = isPaymentServiceConfigured();
        
        if (!isConfigured) {
          // Fallback to simulated payment if API not configured
          console.warn('Payment API not configured. Using simulated payment.');
          setTimeout(async () => {
            await loadGivingStats();
            setLoading(false);
            Alert.alert(
              'Payment Request Sent! 📱',
              `A payment request for GH₵${amount} has been sent to your ${selectedMobileMoneyProvider} number: +233 ${mobileMoneyPhone.replace(/\s+/g, '')}\n\nPlease approve the payment on your phone when you receive the prompt.\n\nTransaction ID: ${donationData.transactionId}\n\nNote: Payment API not configured. This is a test transaction.`,
              [
                {
                  text: 'View History',
                  onPress: () => navigation.navigate('GivingHistory'),
                },
                { text: 'Done', style: 'cancel' },
              ]
            );
            resetForm();
          }, 2000);
          return;
        }

        // Use actual payment API
        try {
          const paymentResult = await initiateMobileMoneyPayment({
            amount: amount,
            phone: mobileMoneyPhone.replace(/\s+/g, ''),
            provider: selectedMobileMoneyProvider,
            email: user.email,
            transactionId: donationData.transactionId,
            category: selectedCategory,
          });

          if (paymentResult.success && paymentResult.paymentLink) {
            // Open payment link in browser
            // On web, use window.open for better UX; on mobile, use Linking
            if (Platform.OS === 'web') {
              window.open(paymentResult.paymentLink, '_blank', 'noopener,noreferrer');
            } else {
              const canOpen = await Linking.canOpenURL(paymentResult.paymentLink);
              if (canOpen) {
                await Linking.openURL(paymentResult.paymentLink);
              }
            }

            setLoading(false);
            Alert.alert(
              'Payment Link Opened! 📱',
              `A payment page has been ${Platform.OS === 'web' ? 'opened in a new tab' : 'opened in your browser'}.\n\nPlease complete the payment using your ${selectedMobileMoneyProvider} mobile money wallet.\n\nTransaction ID: ${donationData.transactionId}`,
              [
                {
                  text: 'View History',
                  onPress: () => navigation.navigate('GivingHistory'),
                },
                { text: 'Done', style: 'cancel' },
              ]
            );
            resetForm();
          } else {
            throw new Error('Failed to initiate payment');
          }
        } catch (error) {
          console.error('Payment API error:', error);
          setLoading(false);
          Alert.alert(
            'Payment Error',
            `Failed to initiate payment: ${error.message}\n\nTransaction ID: ${donationData.transactionId}\n\nYour donation has been recorded. Please contact support if payment was not processed.`,
            [
              {
                text: 'View History',
                onPress: () => navigation.navigate('GivingHistory'),
              },
              { text: 'OK', style: 'cancel' },
            ]
          );
        }
      } else if (selectedPaymentMethod === 'Cash') {
        // Cash payments don't need API processing
        setTimeout(async () => {
          await loadGivingStats();
          setLoading(false);
          Alert.alert(
            'Cash Donation Recorded! 💵',
            `Your cash donation of GH₵${amount} for ${selectedCategory} has been recorded.\n\nPlease bring your cash donation to church during service or contact the church office.\n\nTransaction ID: ${donationData.transactionId}`,
            [
              {
                text: 'View History',
                onPress: () => navigation.navigate('GivingHistory'),
              },
              { text: 'Done', style: 'cancel' },
            ]
          );
          resetForm();
        }, 1000);
      } else {
        // Other payment methods (Card, Bank Transfer) - can be extended later
        setTimeout(async () => {
          await loadGivingStats();
          setLoading(false);
          Alert.alert(
            'Thank You! 🙏',
            `Your donation of GH₵${amount} for ${selectedCategory} has been recorded.\n\nTransaction ID: ${donationData.transactionId}\n\nNote: Payment processing for ${selectedPaymentMethod} will be available soon.`,
            [
              {
                text: 'View History',
                onPress: () => navigation.navigate('GivingHistory'),
              },
              { text: 'Done', style: 'cancel' },
            ]
          );
          resetForm();
        }, 1000);
      }

    } catch (error) {
      console.error('Error processing donation:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to process donation. Please try again.');
    }
  };

  const handleViewHistory = () => {
    navigation.navigate('GivingHistory');
  };

  const resetForm = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setSelectedCategory('Tithe');
    setMobileMoneyPhone('');
    setSelectedMobileMoneyProvider('MTN');
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
        <Text style={styles.headerTitle}>Give</Text>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={handleViewHistory}
        >
          <Ionicons name="time-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="heart" size={32} color="#ef4444" />
          <Text style={styles.infoTitle}>Give Cheerfully</Text>
          <Text style={styles.infoText}>
            "Each of you should give what you have decided in your heart to give, not
            reluctantly or under compulsion, for God loves a cheerful giver."
          </Text>
          <Text style={styles.infoVerse}>2 Corinthians 9:7</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Amount (GH₵)</Text>
          <View style={styles.quickAmountsGrid}>
            {quickAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountCard,
                  selectedAmount === amount && styles.amountCardSelected,
                ]}
                onPress={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
              >
                <Text
                  style={[
                    styles.amountText,
                    selectedAmount === amount && styles.amountTextSelected,
                  ]}
                >
                  ₵{amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Amount</Text>
          <View style={styles.customAmountContainer}>
            <Text style={styles.currencySymbol}>GH₵</Text>
            <TextInput
              style={styles.customAmountInput}
              placeholder="Enter amount"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={customAmount}
              onChangeText={(text) => {
                setCustomAmount(text);
                setSelectedAmount(null);
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === method.name && styles.paymentMethodSelected,
              ]}
              onPress={() => setSelectedPaymentMethod(method.name)}
            >
              <View style={styles.paymentMethodLeft}>
                <View style={[
                  styles.iconContainer,
                  selectedPaymentMethod === method.name && styles.iconContainerSelected,
                ]}>
                  <Ionicons 
                    name={method.icon} 
                    size={24} 
                    color={selectedPaymentMethod === method.name ? '#fff' : '#6366f1'} 
                  />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodTitle}>{method.name}</Text>
                  <Text style={styles.paymentMethodSubtitle}>{method.subtitle}</Text>
                </View>
              </View>
              <View style={[
                styles.radioButton,
                selectedPaymentMethod === method.name && styles.radioButtonSelected,
              ]}>
                {selectedPaymentMethod === method.name && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mobile Money Details Section */}
        {selectedPaymentMethod === 'Mobile Money' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Mobile Money Provider</Text>
            <View style={styles.providerContainer}>
              {mobileMoneyProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={[
                    styles.providerCard,
                    selectedMobileMoneyProvider === provider.id && styles.providerCardSelected,
                  ]}
                  onPress={() => setSelectedMobileMoneyProvider(provider.id)}
                >
                  <View style={[
                    styles.providerIcon,
                    { backgroundColor: provider.color + '20' },
                    selectedMobileMoneyProvider === provider.id && { backgroundColor: provider.color },
                  ]}>
                    <Ionicons 
                      name="phone-portrait" 
                      size={24} 
                      color={selectedMobileMoneyProvider === provider.id ? '#fff' : provider.color} 
                    />
                  </View>
                  <Text style={[
                    styles.providerName,
                    selectedMobileMoneyProvider === provider.id && styles.providerNameSelected,
                  ]}>
                    {provider.name}
                  </Text>
                  <Text style={styles.providerCode}>{provider.code}xxx xxxx</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.mobileMoneyInputContainer}>
              <Text style={styles.sectionTitle}>Mobile Money Number</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+233</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter phone number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  value={mobileMoneyPhone}
                  onChangeText={(text) => {
                    // Remove non-numeric characters except spaces
                    const cleaned = text.replace(/[^0-9\s]/g, '');
                    setMobileMoneyPhone(cleaned);
                  }}
                  maxLength={10}
                />
              </View>
              <Text style={styles.phoneHint}>
                Enter your {selectedMobileMoneyProvider} mobile money number (e.g., 0244123456)
              </Text>
            </View>
          </View>
        )}

        <View style={styles.givingStats}>
          <Text style={styles.statsTitle}>Your Giving This Year</Text>
          {statsLoading ? (
            <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>GH₵{givingStats.total.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Given</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{givingStats.count}</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.giveButton} 
          onPress={handleGiveNow}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#9ca3af', '#6b7280'] : ['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.giveGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="heart" size={24} color="#fff" />
                <Text style={styles.giveButtonText}>Give Now</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="heart-circle" size={60} color="#6366f1" />
              <Text style={styles.modalTitle}>Confirm Your Giving</Text>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Amount:</Text>
                <Text style={styles.modalValue}>
                  GH₵{(selectedAmount || parseFloat(customAmount)).toLocaleString()}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Category:</Text>
                <Text style={styles.modalValue}>{selectedCategory}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Payment:</Text>
                <Text style={styles.modalValue}>{selectedPaymentMethod}</Text>
              </View>
              {selectedPaymentMethod === 'Mobile Money' && (
                <>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Provider:</Text>
                    <Text style={styles.modalValue}>{selectedMobileMoneyProvider}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Phone:</Text>
                    <Text style={styles.modalValue}>+233 {mobileMoneyPhone}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={processDonation}
              >
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonConfirmText}>Confirm</Text>
                </LinearGradient>
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
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  infoVerse: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
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
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  categoryChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  amountCard: {
    width: '48%',
    paddingVertical: 20,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  amountCardSelected: {
    backgroundColor: '#f0f9ff',
    borderColor: '#6366f1',
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  amountTextSelected: {
    color: '#6366f1',
  },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
    marginRight: 10,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 18,
    color: '#1f2937',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  paymentMethodSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSelected: {
    backgroundColor: '#6366f1',
  },
  paymentMethodInfo: {
    marginLeft: 15,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#6366f1',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  givingStats: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  giveButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  giveGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  giveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 15,
  },
  modalBody: {
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  modalButtonConfirm: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Mobile Money styles
  providerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  providerCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  providerCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  providerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  providerNameSelected: {
    color: '#6366f1',
  },
  providerCode: {
    fontSize: 10,
    color: '#9ca3af',
  },
  mobileMoneyInputContainer: {
    marginTop: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#f9fafb',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1f2937',
  },
  phoneHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    paddingHorizontal: 5,
  },
});
