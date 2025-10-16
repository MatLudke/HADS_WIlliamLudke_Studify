/*
  Usage: node scripts/send-fcm-test.js /path/to/serviceAccountKey.json <FCM_TOKEN>
  Sends a test push notification to the provided FCM token using Firebase Admin SDK.
*/

import admin from 'firebase-admin';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/send-fcm-test.js /path/to/serviceAccountKey.json <FCM_TOKEN>');
  process.exit(1);
}

const serviceAccountPath = args[0];
const token = args[1];

try {
  const serviceAccount = JSON.parse(require('fs').readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (err) {
  console.error('Failed to load service account:', err);
  process.exit(1);
}

const message = {
  token,
  notification: {
    title: 'Studify: missed goal test',
    body: 'This is a server-sent test for missed-goal background notification.'
  },
  data: {
    type: 'missed-goal'
  }
};

admin.messaging().send(message)
  .then(response => {
    console.log('Successfully sent message:', response);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error sending message:', error);
    process.exit(1);
  });
