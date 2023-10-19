import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const onUserAdded = functions.firestore.document('user/{doc}').onCreate(async (snap, _) => {
    const user = snap.data()
    if (!user.enterprise) {
        return
    }
    const enterprise = (await user.enterprise.get()).data()
    if (!enterprise) {
        return console.error('Enterprise data not found');
    }
    return db.collection('enterprise').doc(enterprise.id).update(
        {
            employesNo: admin.firestore.FieldValue.increment(1)
        }
    ).then(() => {
    return console.log(
        `Updated enterprise: ${enterprise.name} employes quantity to: ${enterprise.employesNo + 1}`
        );
    }).catch((error) => {
        return console.log(error);
    });
});

export const onUserDeleted = functions.firestore.document('user/{doc}').onDelete(async (snap, _) => {
    const user = snap.data();
    
    if (!user.enterprise) {
        return;
    }

    const enterprise = (await user.enterprise.get()).data();
    if (!enterprise) {
        return console.error('Enterprise data not found');
    }
    return db.collection('enterprise').doc(enterprise.id).update({
            employesNo: admin.firestore.FieldValue.increment(-1)
        })
        .then(() => {
            return console.log(
                `Updated enterprise: ${enterprise.name} employes quantity to: ${enterprise.employesNo - 1}`
            );
        })
        .catch((error) => {
            return console.error(error);
        });
});

export const onUserUpdated = functions.firestore.document('user/{doc}').onUpdate(async (change, context) => {
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
        changed = beforeValue !== afterValue;
      }

      if(changed) break;
    }

    if(changed) {
        return db.collection('user').doc(afterData.uid).update({
            updatedAt: +new Date()
        })
        .then(() => {
            return console.log(`Updated new user: ${afterData.displayName}`);
        })
        .catch((error) => {
            return console.error('Error updating updatedAt in User document:', error);
        });
    }
    return null

});