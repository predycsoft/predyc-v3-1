import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Activity } from 'shared';

const db = admin.firestore();

export const onActivityUpdated = functions.firestore.document('activity/{doc}').onUpdate(async (change, context) => {
    const afterData = change.after.data();
    const beforeData = change.before.data();

    let changed = false;
    for (const field in beforeData) {
      if(field === 'updatedAt') continue;

      const beforeValue = beforeData[field];
      const afterValue = afterData[field];

      // Si el campo es un DocumentReference
      if (beforeValue instanceof admin.firestore.DocumentReference) {
          changed = beforeValue.id !== (afterValue ? afterValue.id : null);
      } else {
          changed = JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
      }

      if (changed) {
          break;  // Si se detectó un cambio, sale del bucle  
      } 
  }

  // Si hubo un cambio y no es sólo el campo updatedAt
  if (changed && !(Object.keys(beforeData).length === 1 && 'updatedAt' in beforeData)) {
      return db.collection(Activity.collection).doc(afterData.id).update({
          updatedAt: +new Date()
      })
      .then(() => {
          return console.log(`Updated activity: ${afterData.title}`);
      })
      .catch((error) => {
          return console.error('Error updating updatedAt in activity document:', error);
      });
  }

  return null;

});