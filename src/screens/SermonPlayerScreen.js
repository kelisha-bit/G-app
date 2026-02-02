import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../firebase.config';
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

// Separate Video Player Component to prevent recreation issues
const VideoPlayerComponent = React.memo(({ mediaUrl, onStatusChange }) => {
  const player = useVideoPlayer(mediaUrl, (player) => {
    player.play();
  });

  useEffect(() => {
    if (player && onStatusChange) {
      const subscription = player.addListener('statusChange', (status) => {
        // Use requestAnimationFrame to avoid setState during render
        requestAnimationFrame(() => {
          onStatusChange(status);
        });
      });
      return () => {
        subscription.remove();
      };
    }
  }, [player, onStatusChange]);

  if (!mediaUrl) return null;

  return (
    <View style={styles.videoContainer}>
      <VideoView
        player={player}
        style={styles.videoPlayer}
        contentFit="contain"
        nativeControls={true}
      />
    </View>
  );
});

export default function SermonPlayerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { sermon } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [sermonData, setSermonData] = useState(sermon || null);
  const [audioInitFailed, setAudioInitFailed] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [totalViews, setTotalViews] = useState(null);
  
  // Audio player refs
  const audioSoundRef = useRef(null);
  const audioStatusUpdateInterval = useRef(null);

  const isVideo = sermonData?.videoUrl && !sermonData?.audioUrl;
  const isAudio = sermonData?.audioUrl && !sermonData?.videoUrl;
  const mediaUrl = sermonData?.videoUrl || sermonData?.audioUrl;

  useEffect(() => {
    if (route.params?.sermonId && !sermonData) {
      loadSermonData();
    } else if (sermonData) {
      setTotalViews(sermonData.views || 0);
      setLoading(false);
    } else {
      setLoading(false);
    }

    // Load viewers when sermon data is available
    if (sermonData?.id) {
      loadViewers();
    }

    return () => {
      // Cleanup
      if (audioSoundRef.current) {
        audioSoundRef.current.unloadAsync().catch(console.error);
      }
      if (audioStatusUpdateInterval.current) {
        clearInterval(audioStatusUpdateInterval.current);
      }
    };
  }, [sermonData?.id]);

  useEffect(() => {
    // Reset error state when sermon changes
    setAudioInitFailed(false);
    
    if (sermonData && mediaUrl) {
      // Initialize player asynchronously to avoid setState during render
      const initTimer = setTimeout(() => {
        initializePlayer();
      }, 0);
      
      // Increment views asynchronously
      const viewsTimer = setTimeout(() => {
        incrementViews();
      }, 100);

      return () => {
        clearTimeout(initTimer);
        clearTimeout(viewsTimer);
      };
    }
  }, [sermonData, mediaUrl]);

  const loadSermonData = async () => {
    try {
      setLoading(true);
      const sermonDoc = await getDoc(doc(db, 'sermons', route.params.sermonId));
      if (sermonDoc.exists()) {
        const data = { id: sermonDoc.id, ...sermonDoc.data() };
        setSermonData(data);
        setTotalViews(data.views || 0);
      } else {
        Alert.alert('Error', 'Sermon not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading sermon:', error);
      Alert.alert('Error', 'Failed to load sermon');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const isDirectAudioFile = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    // Check for direct audio file extensions
    const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac', '.wma'];
    return audioExtensions.some(ext => lowerUrl.includes(ext));
  };

  const isStreamingUrl = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.includes('youtube.com') ||
      lowerUrl.includes('youtu.be') ||
      lowerUrl.includes('vimeo.com') ||
      lowerUrl.includes('soundcloud.com') ||
      lowerUrl.includes('spotify.com') ||
      lowerUrl.includes('podcast') ||
      lowerUrl.includes('stream') ||
      lowerUrl.includes('twitch') ||
      lowerUrl.includes('facebook.com/watch') ||
      lowerUrl.includes('drive.google.com') && !lowerUrl.includes('export=download') ||
      lowerUrl.includes('dropbox.com') && !lowerUrl.includes('dl=1')
    );
  };

  const initializePlayer = async () => {
    if (isVideo) {
      // Video player is initialized via useVideoPlayer hook
      return;
    }

    if (isAudio) {
      try {
        // Check if URL is a streaming service that expo-av can't handle
        if (isStreamingUrl(mediaUrl)) {
          Alert.alert(
            'Streaming Audio Detected',
            'This audio link appears to be from a streaming service (YouTube, SoundCloud, etc.) which requires opening in a browser. Would you like to open it there?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open in Browser',
                onPress: async () => {
                  try {
                    const supported = await Linking.canOpenURL(mediaUrl);
                    if (supported) {
                      await Linking.openURL(mediaUrl);
                    } else {
                      Alert.alert('Error', 'Cannot open this URL');
                    }
                  } catch (error) {
                    console.error('Error opening URL:', error);
                    Alert.alert('Error', 'Failed to open audio link');
                  }
                },
              },
            ]
          );
          return;
        }

        // Check if it's not a direct audio file - warn user
        if (!isDirectAudioFile(mediaUrl)) {
          console.warn('Audio URL may not be a direct file:', mediaUrl);
          // Continue anyway, but catch the error if it fails
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: mediaUrl },
          { shouldPlay: false, volume: volume }
        );

        audioSoundRef.current = sound;

        // Get initial status
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setDuration(status.durationMillis / 1000);
        }

        // Set up status update interval
        audioStatusUpdateInterval.current = setInterval(async () => {
          if (audioSoundRef.current) {
            const status = await audioSoundRef.current.getStatusAsync();
            if (status.isLoaded) {
              setCurrentTime(status.positionMillis / 1000);
              setIsPlaying(status.isPlaying);
              if (status.durationMillis) {
                setDuration(status.durationMillis / 1000);
              }
            }
          }
        }, 500);

        // Set up playback finished listener
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlaying(false);
              setCurrentTime(0);
            }
          }
        });
      } catch (error) {
        console.error('Error initializing audio player:', error);
        console.error('Audio URL:', mediaUrl);
        
        // Check for the specific extractor error
        const isExtractorError = error.message && (
          error.message.includes('extractors') ||
          error.message.includes('extractor') ||
          error.message.includes('could read the stream')
        );
        
        // Provide more helpful error messages
        let errorMessage = 'Failed to load audio. ';
        let showBrowserOption = true;
        
        if (isExtractorError) {
          errorMessage += 'The audio format is not supported or the URL is not a direct audio file link.\n\n';
          errorMessage += 'expo-av requires direct links to audio files (MP3, M4A, AAC, WAV, etc.). ';
          errorMessage += 'Streaming services, Google Drive links, or other indirect URLs cannot be played directly.';
        } else if (error.message && error.message.includes('network')) {
          errorMessage += 'Please check your internet connection.';
          showBrowserOption = false;
        } else if (error.message && error.message.includes('404') || error.message.includes('not found')) {
          errorMessage += 'The audio file was not found. Please check the URL.';
          showBrowserOption = false;
        } else {
          errorMessage += 'Please check the audio URL and try again.';
        }

        const alertButtons = [
          {
            text: 'OK',
            style: 'cancel',
          },
        ];

        if (showBrowserOption) {
          alertButtons.push({
            text: 'Open in Browser',
            onPress: async () => {
              try {
                const supported = await Linking.canOpenURL(mediaUrl);
                if (supported) {
                  await Linking.openURL(mediaUrl);
                } else {
                  Alert.alert('Error', 'Cannot open this URL');
                }
              } catch (linkError) {
                console.error('Error opening URL:', linkError);
              }
            },
          });
        }

        // Set flag to show UI that audio failed
        setAudioInitFailed(true);
        
        Alert.alert(
          'Audio Playback Error',
          errorMessage,
          alertButtons
        );
      }
    }
  };

  const incrementViews = async () => {
    if (!sermonData?.id || !auth.currentUser) return;
    
    try {
      const sermonRef = doc(db, 'sermons', sermonData.id);
      
      // Increment total views count
      await updateDoc(sermonRef, {
        views: increment(1),
      });

      // Update local state
      setTotalViews((prev) => (prev !== null ? prev + 1 : (sermonData.views || 0) + 1));

      // Track individual user view
      const viewId = `${sermonData.id}_${auth.currentUser.uid}`;
      const viewRef = doc(db, 'sermonViews', viewId);
      
      // Get user data for display
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Create or update the view record (merge: true means it won't create duplicate records for same user)
      await setDoc(viewRef, {
        sermonId: sermonData.id,
        userId: auth.currentUser.uid,
        userName: userData.fullName || auth.currentUser.displayName || 'Anonymous',
        userEmail: userData.email || auth.currentUser.email || '',
        viewedAt: serverTimestamp(),
        lastViewedAt: serverTimestamp(),
      }, { merge: true });

      // Reload viewers list
      loadViewers();
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const loadViewers = async () => {
    if (!sermonData?.id) return;
    
    try {
      setLoadingViewers(true);
      const q = query(
        collection(db, 'sermonViews'),
        where('sermonId', '==', sermonData.id)
      );
      const querySnapshot = await getDocs(q);
      
      const viewersList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        viewersList.push({
          id: doc.id,
          userName: data.userName || 'Anonymous',
          userEmail: data.userEmail || '',
          viewedAt: data.viewedAt || data.lastViewedAt,
        });
      });
      
      // Sort by most recent view
      viewersList.sort((a, b) => {
        const timeA = a.viewedAt?.toMillis?.() || 0;
        const timeB = b.viewedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setViewers(viewersList);
    } catch (error) {
      console.error('Error loading viewers:', error);
    } finally {
      setLoadingViewers(false);
    }
  };

  const togglePlayPause = async () => {
    // Video player uses native controls, so this is mainly for audio
    if (isAudio && audioSoundRef.current) {
      try {
        const status = await audioSoundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await audioSoundRef.current.pauseAsync();
          } else {
            await audioSoundRef.current.playAsync();
          }
        }
      } catch (error) {
        console.error('Error toggling playback:', error);
      }
    }
  };

  const seekTo = async (time) => {
    // Video player uses native controls for seeking
    if (isAudio && audioSoundRef.current) {
      try {
        await audioSoundRef.current.setPositionAsync(time * 1000);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
    setCurrentTime(time);
  };

  const changePlaybackRate = async (rate) => {
    const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    
    setPlaybackRate(newRate);
    
    // Video player uses native controls for playback rate
    if (isAudio && audioSoundRef.current) {
      try {
        await audioSoundRef.current.setRateAsync(newRate, true);
      } catch (error) {
        console.error('Error changing playback rate:', error);
      }
    }
  };

  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    // Video player uses native controls for mute
    if (isAudio && audioSoundRef.current) {
      try {
        await audioSoundRef.current.setVolumeAsync(newMuted ? 0 : volume);
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video player status updates - use useCallback to prevent recreation
  const handleVideoStatusChange = React.useCallback((status) => {
    setIsPlaying(status.isPlaying);
    if (status.durationMillis) {
      setDuration(status.durationMillis / 1000);
    }
    if (status.positionMillis !== undefined) {
      setCurrentTime(status.positionMillis / 1000);
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading sermon...</Text>
        </View>
      </View>
    );
  }

  if (!sermonData || !mediaUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>No media available</Text>
          <Text style={styles.errorSubtext}>This sermon does not have a video or audio link.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {sermonData.title || 'Sermon'}
        </Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Media Player */}
        {isVideo ? (
          <VideoPlayerComponent 
            key={mediaUrl} // Key ensures component is recreated when URL changes
            mediaUrl={mediaUrl} 
            onStatusChange={handleVideoStatusChange}
          />
        ) : isAudio ? (
          <View style={styles.audioContainer}>
            {sermonData.image ? (
              <Image
                source={{ uri: sermonData.image }}
                style={styles.audioImage}
              />
            ) : (
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.audioImage}
              >
                <Ionicons name="headset" size={64} color="#fff" style={{ opacity: 0.3 }} />
              </LinearGradient>
            )}
            <View style={styles.audioControls}>
              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={togglePlayPause}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={48}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Sermon Info */}
        <View style={styles.sermonInfo}>
          <Text style={styles.sermonTitle}>{sermonData.title || 'Untitled Sermon'}</Text>
          <Text style={styles.sermonPastor}>{sermonData.pastor || 'Speaker not specified'}</Text>
          
          {sermonData.date && (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text style={styles.metaText}>
                {new Date(sermonData.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}

          {sermonData.series && (
            <View style={styles.seriesBadge}>
              <Ionicons name="albums-outline" size={14} color="#8b5cf6" />
              <Text style={styles.seriesText}>{sermonData.series}</Text>
            </View>
          )}

          {sermonData.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{sermonData.description}</Text>
            </View>
          )}

          {/* Audio Controls (only for audio sermons) */}
          {isAudio && (
            <View style={styles.audioControlPanel}>
              {audioInitFailed && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text style={styles.errorBannerText}>
                    Audio cannot be played directly. Use the "Open in Browser" button below.
                  </Text>
                </View>
              )}
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <TouchableOpacity
                  style={styles.progressBarContainer}
                  onPress={(e) => {
                    const { locationX } = e.nativeEvent;
                    const progressBarWidth = width - 140; // Approximate width
                    const percentage = locationX / progressBarWidth;
                    const newTime = Math.max(0, Math.min(duration, duration * percentage));
                    seekTo(newTime);
                  }}
                  activeOpacity={1}
                >
                  <View style={[styles.progressBar, { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }]} />
                </TouchableOpacity>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              {/* Control Buttons */}
              {!audioInitFailed && (
                <View style={styles.controlButtons}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => seekTo(Math.max(0, currentTime - 10))}
                  >
                    <Ionicons name="play-back" size={24} color="#6366f1" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.controlButton, styles.playPauseButtonSmall]}
                    onPress={togglePlayPause}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={32}
                      color="#fff"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => seekTo(Math.min(duration, currentTime + 10))}
                  >
                    <Ionicons name="play-forward" size={24} color="#6366f1" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Secondary Controls */}
              {!audioInitFailed && (
                <View style={styles.secondaryControls}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={toggleMute}
                  >
                    <Ionicons
                      name={isMuted ? 'volume-mute' : 'volume-high'}
                      size={20}
                      color="#6366f1"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={changePlaybackRate}
                  >
                    <Text style={styles.playbackRateText}>{playbackRate}x</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Viewers Section */}
        <View style={styles.viewersContainer}>
          <View style={styles.viewersHeader}>
            <Ionicons name="people-outline" size={20} color="#6366f1" />
            <View style={styles.viewersTitleContainer}>
              <Text style={styles.viewersTitle}>
                {loadingViewers 
                  ? 'Loading viewers...' 
                  : viewers.length === 0 
                    ? 'No viewers yet' 
                    : `${viewers.length} ${viewers.length === 1 ? 'Person' : 'People'} Viewed This Sermon`}
              </Text>
              {totalViews !== null && totalViews > 0 && (
                <Text style={styles.totalViewsText}>
                  {totalViews} total {totalViews === 1 ? 'view' : 'views'}
                </Text>
              )}
            </View>
          </View>
          {loadingViewers ? (
            <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 10 }} />
          ) : viewers.length > 0 ? (
            <ScrollView 
              style={styles.viewersList}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.viewersListContent}
            >
              {viewers.map((viewer, index) => (
                <View key={viewer.id || index} style={styles.viewerItem}>
                  <View style={styles.viewerAvatar}>
                    <Text style={styles.viewerAvatarText}>
                      {viewer.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.viewerName} numberOfLines={1}>
                    {viewer.userName}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noViewersText}>
              Be the first to view this sermon!
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.notesButton}
            onPress={() => {
              navigation.navigate('SermonNotes', {
                sermonId: sermonData.id,
                sermonTitle: sermonData.title,
              });
            }}
          >
            <Ionicons name="document-text" size={20} color="#6366f1" />
            <Text style={styles.notesButtonText}>View Notes</Text>
          </TouchableOpacity>

          {isAudio && (
            <TouchableOpacity
              style={styles.openBrowserButton}
              onPress={async () => {
                try {
                  const supported = await Linking.canOpenURL(mediaUrl);
                  if (supported) {
                    await Linking.openURL(mediaUrl);
                  } else {
                    Alert.alert('Error', 'Cannot open this URL');
                  }
                } catch (error) {
                  console.error('Error opening URL:', error);
                  Alert.alert('Error', 'Failed to open audio link');
                }
              }}
            >
              <Ionicons name="open-outline" size={20} color="#6366f1" />
              <Text style={styles.notesButtonText}>Open in Browser</Text>
            </TouchableOpacity>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButtonHeader: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    width: '100%',
    height: height * 0.3,
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  audioContainer: {
    width: '100%',
    height: height * 0.4,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  audioImage: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  audioControls: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sermonInfo: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 15,
    marginHorizontal: 20,
  },
  sermonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sermonPastor: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  seriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  seriesText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    marginLeft: 6,
  },
  descriptionContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  audioControlPanel: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    width: 50,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  controlButton: {
    padding: 10,
  },
  playPauseButtonSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  secondaryButton: {
    padding: 10,
  },
  playbackRateText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 10,
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  openBrowserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
    marginTop: 10,
  },
  notesButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    marginLeft: 8,
    lineHeight: 18,
  },
  viewersContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  viewersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewersTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  viewersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalViewsText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  viewersList: {
    flexDirection: 'row',
  },
  viewersListContent: {
    paddingRight: 5,
  },
  viewerItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  noViewersText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginVertical: 10,
    fontStyle: 'italic',
  },
  viewerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  viewerAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewerName: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    width: '100%',
  },
});

