import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const onProfileAdded = functions.firestore.document('profile/{doc}').onCreate(async (snap, _) => {
    const profile = snap.data();
    
    if (!profile.enterpriseRef || !Array.isArray(profile.enterpriseRef)) {
        console.log("El perfil no tiene un array de enterpriseRef")
        return;
    }

    for (const enterpriseRef of profile.enterpriseRef) {
        const enterprise = (await enterpriseRef.get()).data();
        
        if (!enterprise) {
            console.error('Enterprise data not found');
            continue;
        }
        return db.collection('enterprise').doc(enterprise.id).update(
            {
            profilesNo: admin.firestore.FieldValue.increment(1)
            }
        ).then(() => {
            console.log(
                `Updated enterprise: ${enterprise.name} profiles quantity to: ${enterprise.profilesNo + 1}`
            );
        }).catch((error) => {
            console.error(error);
        });
    }
});
