# Manual Firebase Secrets Setup for EAS
# Run these commands one by one, or copy and paste them all

Write-Host "Setting up Firebase secrets for EAS..." -ForegroundColor Cyan
Write-Host ""

# Firebase API Key
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIzaSyB3mkl2j1ce9YBZg_NptLSZHnqb-_N_Qr8" --type string --force

# Firebase Auth Domain
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "greater-works-city-churc-4a673.firebaseapp.com" --type string --force

# Firebase Project ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "greater-works-city-churc-4a673" --type string --force

# Firebase Storage Bucket
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "greater-works-city-churc-4a673.firebasestorage.app" --type string --force

# Firebase Messaging Sender ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "660034620094" --type string --force

# Firebase App ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:660034620094:web:8d6aa5b0993c51e2696cef" --type string --force

# Firebase Measurement ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID --value "G-W76BM8J293" --type string --force

Write-Host ""
Write-Host "✅ All Firebase secrets have been set!" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Build your preview build" -ForegroundColor Cyan
Write-Host "   eas build --platform android --profile preview" -ForegroundColor White







