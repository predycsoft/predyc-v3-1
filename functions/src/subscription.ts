import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { update } from 'lodash';

const db = admin.firestore();


export const checkExpiredSubscriptions = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = +new Date();
    const licenseRef = db.collection('subscription');
    const snapshot = await licenseRef.where('currentPeriodEnd', '<', now).get();

    if (snapshot.empty) {
        console.log('No matching documents.');
        return null;
    }

    let batch = db.batch();

    snapshot.forEach(doc => {
        const docData = doc.data();
        const docRef = licenseRef.doc(doc.id);
        const currentPeriodEnd = docData.currentPeriodEnd;

        // Update subscription
        batch.update(docRef, {
            status: 'canceled',
            canceledAt: currentPeriodEnd,
            endedAt: currentPeriodEnd
        });

        // Update user
        if (docData.userRef) {
            // Asume que userRef es una referencia de DocumentReference válida
            const userDocRef = docData.userRef;
            batch.update(userDocRef, { status: 'canceled' });
        }
    });

    // Ejecutar el batch
    try {
        await batch.commit();
        console.log('Status updated to canceled for expired licenses and users.');
        return null
    } catch (error) {
        console.error('Error updating documents: ', error);
        return null
    }
});

