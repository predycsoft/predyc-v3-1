import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();


export const checkExpirdeLicenses = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = +new Date();
    const licenseRef = admin.firestore().collection('license');
    const snapshot = await licenseRef.where('currentPeriodEnd', '<', now).get();
  
    if (snapshot.empty) {
      console.log('No matching documents.');
      return null;
    }
  
    // Pepare batch to update documents
    let batch = admin.firestore().batch();
  
    snapshot.forEach(doc => {
      const docRef = licenseRef.doc(doc.id);
      batch.update(docRef, { status: 'canceled' });
    });
  
    // Execute batch
    return batch.commit().then(() => {
      console.log('Status updated to canceled for expired licenses.');
    }).catch(error => {
      console.error('Error updating documents: ', error);
    });
});

