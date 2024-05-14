import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { update } from 'lodash';
import { Subscription } from 'shared';

const db = admin.firestore();


export const checkExpiredSubscriptions = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = +new Date();
    const subscriptionRef = db.collection(Subscription.collection);
    const snapshot = await subscriptionRef.where('currentPeriodEnd', '<', now).get();

    if (snapshot.empty) {
        console.log('No matching documents!!!.');
        return null;
    }

    let batch = db.batch();

    for (const doc of snapshot.docs) {
        const docData = doc.data();

        // Skip if there's no productRef
        if (!docData.productRef) {
            console.log(docData.id + "subscription doesnt have productRef set")
            continue
        } 

        const productSnapshot = await docData.productRef.get();

        if (!productSnapshot.exists) {
            console.log(`Product not found for subscription: ${doc.id}`);
            continue;
        }

        const productData = productSnapshot.data();

        // Skip if autodeactivate is not true
        if (!productData.autodeactivate) {
            console.log(productData.name + " skipped (autodeactivated = false)")
            continue;
        }

        const currentPeriodEnd = docData.currentPeriodEnd;
        const docRef = subscriptionRef.doc(doc.id);

        // Update subscription
        console.log("upadting ", docData.id, " subscription")
        batch.update(docRef, {
            status: 'inactive',
            canceledAt: currentPeriodEnd,
            endedAt: currentPeriodEnd
        });

        // Update user
        if (docData.userRef) {
            console.log("upadting ", docData.userRef.id, " user")
            const userDocRef = docData.userRef;
            batch.update(userDocRef, { status: 'inactive' });
        }
    }

    // Execute the batch
    try {
        await batch.commit();
        console.log('Status updated to inactive for expired subscriptions and users with auto-deactivate enabled.');
        return null;
    } catch (error) {
        console.error('Error updating documents: ', error);
        return null;
    }
});

