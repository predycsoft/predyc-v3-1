import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Enterprise, User } from 'shared';

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
    return db.collection(Enterprise.collection).doc(enterprise.id).update(
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
    return db.collection(Enterprise.collection).doc(enterprise.id).update({
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
        if (field === 'updatedAt') continue;  // Ignora el campo updatedAt

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
        return db.collection(User.collection).doc(afterData.uid).update({
            updatedAt: +new Date()
        })
        .then(() => {
            return console.log(`Updated user: ${afterData.displayName}`);
        })
        .catch((error) => {
            return console.error('Error updating updatedAt in User document:', error);
        });
    }

    return null;
});