/**
 * Script to generate VAPID keys for web push notifications
 * 
 * VAPID (Voluntary Application Server Identification) keys are required
 * for web push notifications in Expo.
 * 
 * Usage: node scripts/generateVapidKeys.js
 */

const crypto = require('crypto');

function generateVapidKeys() {
  const curve = crypto.createECDH('prime256v1');
  curve.generateKeys();

  const publicKey = curve.getPublicKey('base64url');
  const privateKey = curve.getPrivateKey('base64url');

  console.log('\n✅ VAPID Keys Generated Successfully!\n');
  console.log('📋 Add this to your app.json under expo.notification:');
  console.log('   "notification": {');
  console.log(`     "vapidPublicKey": "${publicKey}"`);
  console.log('   }');
  console.log('\n🔐 PRIVATE KEY (keep this secret - use on your server):');
  console.log(`   ${privateKey}`);
  console.log('\n⚠️  IMPORTANT:');
  console.log('   1. Add the PUBLIC key to app.json (shown above)');
  console.log('   2. Keep the PRIVATE key secure - do NOT commit it to git');
  console.log('   3. Use the PRIVATE key on your server when sending push notifications');
  console.log('   4. See: https://docs.expo.dev/versions/latest/guides/using-vapid/\n');

  return { publicKey, privateKey };
}

// Run if called directly
if (require.main === module) {
  generateVapidKeys();
}

module.exports = { generateVapidKeys };

