import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase.config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

export default function GivingHistoryScreen({ navigation }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, thisYear, thisMonth

  useEffect(() => {
    loadDonations();
  }, [selectedFilter]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      let startDate = null;
      
      if (selectedFilter === 'thisYear') {
        const currentYear = new Date().getFullYear();
        startDate = new Date(currentYear, 0, 1);
      } else if (selectedFilter === 'thisMonth') {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Query donations
      const donationsRef = collection(db, 'donations');
      let q = query(
        donationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      // Apply date filter if needed
      if (startDate) {
        q = query(
          donationsRef,
          where('userId', '==', user.uid),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const donationsData = [];

      querySnapshot.forEach((doc) => {
        donationsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setDonations(donationsData);
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDonations();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateTotals = () => {
    const total = donations
      .filter(d => d.status === 'completed' || d.status === 'pending')
      .reduce((sum, d) => sum + d.amount, 0);
    return total;
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
        <Text style={styles.headerTitle}>Giving History</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipSelected]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextSelected]}>
              All Time
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'thisYear' && styles.filterChipSelected]}
            onPress={() => setSelectedFilter('thisYear')}
          >
            <Text style={[styles.filterText, selectedFilter === 'thisYear' && styles.filterTextSelected]}>
              This Year
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'thisMonth' && styles.filterChipSelected]}
            onPress={() => setSelectedFilter('thisMonth')}
          >
            <Text style={[styles.filterText, selectedFilter === 'thisMonth' && styles.filterTextSelected]}>
              This Month
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {!loading && donations.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Given</Text>
          <Text style={styles.summaryAmount}>GH₵{calculateTotals().toLocaleString()}</Text>
          <Text style={styles.summaryCount}>{donations.length} transactions</Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading your giving history...</Text>
          </View>
        ) : donations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-dislike-outline" size={80} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Donations Yet</Text>
            <Text style={styles.emptyText}>
              Your giving history will appear here once you make your first donation.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.goBack()}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.emptyButtonGradient}
              >
                <Ionicons name="heart" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Give Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.donationsList}>
            {donations.map((donation) => (
              <View key={donation.id} style={styles.donationCard}>
                <View style={styles.donationHeader}>
                  <View style={styles.donationLeft}>
                    <View style={[styles.categoryIcon, { backgroundColor: getStatusColor(donation.status) + '20' }]}>
                      <Ionicons name="heart" size={24} color={getStatusColor(donation.status)} />
                    </View>
                    <View style={styles.donationInfo}>
                      <Text style={styles.donationCategory}>{donation.category}</Text>
                      <Text style={styles.donationDate}>{formatDate(donation.createdAt)}</Text>
                    </View>
                  </View>
                  <View style={styles.donationRight}>
                    <Text style={styles.donationAmount}>GH₵{donation.amount.toLocaleString()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(donation.status) + '20' }]}>
                      <Ionicons
                        name={getStatusIcon(donation.status)}
                        size={12}
                        color={getStatusColor(donation.status)}
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(donation.status) }]}>
                        {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.donationDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>{donation.paymentMethod}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="receipt-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>{donation.transactionId}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

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
  placeholder: {
    width: 40,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
  },
  filterChipSelected: {
    backgroundColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 10,
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  summaryCount: {
    fontSize: 14,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  donationsList: {
    padding: 20,
    paddingTop: 10,
  },
  donationCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  donationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donationInfo: {
    marginLeft: 12,
  },
  donationCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
  },
  donationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  donationRight: {
    alignItems: 'flex-end',
  },
  donationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  donationDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
  },
});



