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
        `Updated enterprise: ${enterprise.name} notifications quantity to: ${enterprise.employesNo + 1}`
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