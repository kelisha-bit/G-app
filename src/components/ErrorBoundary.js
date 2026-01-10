import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 * 
 * Usage:
 *   <ErrorBoundary>
 *     <YourApp />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    // Store error info for display
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Log to error reporting service (e.g., Sentry, Firebase Crashlytics)
    // Example:
    // if (Sentry) {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    // Reset error state to allow user to try again
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    // For development: Reload app
    if (__DEV__) {
      // In production, you might want to restart the app differently
      this.handleReset();
    } else {
      this.handleReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <LinearGradient 
            colors={['#6366f1', '#8b5cf6', '#d946ef']} 
            style={styles.gradient}
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="alert-circle" size={64} color="#fff" />
              </View>
              
              <Text style={styles.title}>Something Went Wrong</Text>
              <Text style={styles.message}>
                We're sorry, but something unexpected happened. The app has encountered an error.
              </Text>

              {__DEV__ && this.state.error && (
                <ScrollView style={styles.errorDetails}>
                  <Text style={styles.errorTitle}>Error Details (Dev Mode):</Text>
                  <Text style={styles.errorText}>
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo && (
                    <Text style={styles.errorStack}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </ScrollView>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={this.handleReset}
                >
                  <LinearGradient
                    colors={['#fff', '#f3f4f6']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="refresh" size={20} color="#6366f1" />
                    <Text style={styles.primaryButtonText}>Try Again</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={this.handleReload}
                >
                  <Ionicons name="reload" size={20} color="#fff" />
                  <Text style={styles.secondaryButtonText}>Reload App</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.helpText}>
                If the problem persists, please contact support or restart the app.
              </Text>
            </View>
          </LinearGradient>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  errorDetails: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#ffeb3b',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  errorStack: {
    fontSize: 10,
    color: '#ff9800',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    gap: 10,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ErrorBoundary;

