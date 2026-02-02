import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../firebase.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import notificationService from '../utils/notificationService';

export default function PrayerEntryDetailsScreen({ route, navigation }) {
  const { prayerId } = route.params;
  const insets = useSafeAreaInsets();
  const [prayer, setPrayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPrayer();
  }, [prayerId]);

  const loadPrayer = async () => {
    try {
      setLoading(true);
      const prayerDoc = await getDoc(doc(db, 'prayerJournal', prayerId));
      
      if (prayerDoc.exists()) {
        const data = prayerDoc.data();
        setPrayer({
          id: prayerDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || null,
          reminderDate: data.reminderDate?.toDate?.() || null,
          answeredDate: data.answeredDate?.toDate?.() || null,
        });
      } else {
        Alert.alert('Error', 'Prayer entry not found');
        navigation.goBack();
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading prayer:', error);
      Alert.alert('Error', 'Failed to load prayer entry');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAnswered = async () => {
    try {
      setUpdating(true);
      await updateDoc(doc(db, 'prayerJournal', prayerId), {
        isAnswered: true,
        answeredDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      setPrayer({
        ...prayer,
        isAnswered: true,
        answeredDate: new Date(),
      });
      
      Alert.alert('Success', 'Prayer marked as answered! 🙏');
    } catch (error) {
      if (__DEV__) console.error('Error updating prayer:', error);
      Alert.alert('Error', 'Failed to update prayer');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkUnanswered = async () => {
    try {
      setUpdating(true);
      await updateDoc(doc(db, 'prayerJournal', prayerId), {
        isAnswered: false,
        answeredDate: null,
        updatedAt: serverTimestamp(),
      });
      
      setPrayer({
        ...prayer,
        isAnswered: false,
        answeredDate: null,
      });
    } catch (error) {
      if (__DEV__) console.error('Error updating prayer:', error);
      Alert.alert('Error', 'Failed to update prayer');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Prayer',
      'Are you sure you want to delete this prayer entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel any scheduled notification for this prayer
              try {
                await notificationService.cancelPrayerJournalReminder(prayerId);
              } catch (cancelError) {
                console.error('Error canceling prayer reminder notification:', cancelError);
              }
              
              await deleteDoc(doc(db, 'prayerJournal', prayerId));
              Alert.alert('Success', 'Prayer entry deleted');
              navigation.goBack();
            } catch (error) {
              if (__DEV__) console.error('Error deleting prayer:', error);
              Alert.alert('Error', 'Failed to delete prayer entry');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date) => {
    if (!date) return '';
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    } else {
      d = new Date(date);
      if (isNaN(d.getTime())) return '';
    }
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading prayer...</Text>
        </View>
      </View>
    );
  }

  if (!prayer) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer Details</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('AddPrayerEntry', { prayerId: prayer.id })}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        {prayer.isAnswered && (
          <View style={styles.answeredBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <View style={styles.answeredBannerContent}>
              <Text style={styles.answeredBannerTitle}>Prayer Answered!</Text>
              {prayer.answeredDate && (
                <Text style={styles.answeredBannerDate}>
                  Answered on {formatDate(prayer.answeredDate)}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Prayer Title</Text>
          <Text style={styles.title}>{prayer.title}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Prayer Request</Text>
          <Text style={styles.request}>{prayer.request}</Text>
        </View>

        {prayer.notes && (
          <View style={styles.card}>
            <Text style={styles.label}>Notes & Reflections</Text>
            <Text style={styles.notes}>{prayer.notes}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
              <Text style={styles.metaText}>Created: {formatDate(prayer.createdAt)}</Text>
            </View>
            {prayer.reminderDate && (
              <View style={styles.metaItem}>
                <Ionicons name="alarm-outline" size={18} color="#f59e0b" />
                <Text style={styles.metaText}>
                  Reminder: {formatDate(prayer.reminderDate)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {!prayer.isAnswered ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.answeredButton]}
              onPress={handleMarkAnswered}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Mark as Answered</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.unansweredButton]}
              onPress={handleMarkUnanswered}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Mark as Unanswered</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  answeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  answeredBannerContent: {
    flex: 1,
  },
  answeredBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  answeredBannerDate: {
    fontSize: 14,
    color: '#059669',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 32,
  },
  request: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  notes: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  metaRow: {
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  answeredButton: {
    backgroundColor: '#10b981',
  },
  unansweredButton: {
    backgroundColor: '#6366f1',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

