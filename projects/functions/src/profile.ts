import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Enterprise } from 'shared';

const db = admin.firestore();

export const onProfileAdded = functions.firestore.document('profile/{doc}').onCreate(async (snap, _) => {
    const profile = snap.data();
    
    if (!profile.enterpriseRef || !(profile.enterpriseRef instanceof admin.firestore.DocumentReference)) {
        console.log("El perfil no tiene enterpriseRef como DocumentReference");
        return;
    }

    const enterpriseRef = profile.enterpriseRef;
    const enterprise = (await enterpriseRef.get()).data();

    if (!enterprise || !enterprise.id) {
        console.error('Enterprise data not found');
        return;
    }

    return db.collection(Enterprise.collection).doc(enterprise.id).update(
        {
            profilesNo: admin.firestore.FieldValue.increment(1)
        }
    ).then(() => {
        console.log(`Updated enterprise: ${enterprise.name} profiles quantity to: ${enterprise.profilesNo + 1}`);
    }).catch((error) => {
        console.error(error);
    });
});
