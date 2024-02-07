import * as functions from 'firebase-functions';
// import { Notification } from '../../src/app/shared/models/notification.model'
// import { Enterprise } from '../../src/app/shared/models/enterprise.model'
import * as admin from 'firebase-admin';

const db = admin.firestore();

// export const onNotificationAdded = functions.firestore
//   .document('notification/{doc}')
//   .onCreate(async (snap, _) => {
//     const notification = snap.data()
//     if (!notification.enterpriseRef) {
//         return
//     }
//     const enterprise = (await notification.enterpriseRef.get()).data()
//     let fieldToIncrement: string = ''
//     switch (notification.type) {
//         case 'event':
//             fieldToIncrement = 'totalEventNotifications'
//             break;
//         case 'alert':
//             fieldToIncrement = 'totalAlertNotifications'
//             break;
//     }
//     return db
//           .collection('enterprise')
//           .doc(enterprise.id)
//           .update({
//             [fieldToIncrement]: admin.firestore.FieldValue.increment(1)
//           })
//           .then(() => {
//             return console.log(
//                 `Updated enterprise: ${enterprise.name} notifications quantity to:
//                     ${'event'}: ${notification.type == 'event' ? enterprise.totalEventNotifications + 1 : enterprise.totalEventNotifications}
//                     ${'alert'}: ${notification.type == 'alert' ? enterprise.totalAlertNotifications + 1 : enterprise.totalAlertNotifications}
//                 `
//             );
//           })
//           .catch((error) => {
//             return console.log(error);
//           });
//   });

//   export const onNotificationReadByAdmin = functions.firestore
//   .document('notification/{doc}')
//   .onUpdate(async (change, context) => {
//     const beforeData = change.before.data();
//     const afterData = change.after.data();

//     if (afterData?.readByAdmin && !beforeData?.readByAdmin) {
//       const notification = afterData;
//       if (!notification.type || !notification.enterpriseRef) {
//         console.error('Notification type or enterpriseRef missing');
//         return;
//       }
//       const enterprise = (await notification.enterpriseRef.get()).data();
//       if (!enterprise) {
//         console.error('Enterprise document not found');
//         return;
//       }

//       // Determinar el campo a decrementar basado en el type de notificación
//       let fieldToDecrement: string = '';
//       switch (notification.type) {
//         case 'event':
//           fieldToDecrement = 'totalEventNotifications';
//           break;
//         case 'alert':
//           fieldToDecrement = 'totalAlertNotifications';
//           break;
//         default:
//           console.error('Invalid notification type');
//           return;
//       }

//       // Actualizar el documento de Enterprise
//       return db.collection('enterprise').doc(enterprise.id).update({
//           [fieldToDecrement]: admin.firestore.FieldValue.increment(-1),
//           totalReadByAdminNotifications: admin.firestore.FieldValue.increment(1),
//         })
//         .then(() => {
//           console.log(`Updated enterprise: ${enterprise.name} notifications quantity to:
//           ${'event'}: ${notification.type == 'event' ? enterprise.totalEventNotifications - 1 : enterprise.totalEventNotifications}
//           ${'alert'}: ${notification.type == 'alert' ? enterprise.totalAlertNotifications - 1 : enterprise.totalAlertNotifications}
//           ${'readByAdmin'}: ${enterprise.totalReadByAdminNotifications + 1 }`)
//           return console.log(`Updated enterprise: ${enterprise.name} notifications count`);
//         })
//         .catch((error) => {
//           return console.error('Error updating Enterprise document:', error);
//         });
//     }
//     return null;
//   });


// export const onNotificationAdded = functions.firestore
//   .document('notification/{doc}')
//   .onCreate(async (snap, _) => {
//     const notification = snap.data()
//     if (!notification.enterpriseRef) {
//         return
//     }
//     const enterprise = (await notification.enterpriseRef.get()).data()
//     let fieldToIncrement: string = ''
//     switch (notification.type) {
//         case Notification.TYPE_ACTIVITY:
//             fieldToIncrement = 'totalActivityNotifications'
//             break;
//         case Notification.TYPE_ALERT:
//             fieldToIncrement = 'totalAlertNotifications'
//             break;
//         case Notification.TYPE_REQUEST:
//             fieldToIncrement = 'totalRequestNotifications'
//             break;
//     }
//     return db
//           .collection(Enterprise.collection)
//           .doc(enterprise.id)
//           .update({
//             [fieldToIncrement]: admin.firestore.FieldValue.increment(1)
//           })
//           .then(() => {
//             return console.log(
//                 `Updated enterprise: ${enterprise.name} notifications quantity to:
//                     ${Notification.TYPE_ACTIVITY}: ${notification.type == Notification.TYPE_ACTIVITY ? enterprise.totalActivityNotifications + 1 : enterprise.totalActivityNotifications}
//                     ${Notification.TYPE_ALERT}: ${notification.type == Notification.TYPE_ALERT ? enterprise.totalAlertNotifications + 1 : enterprise.totalAlertNotifications}
//                     ${Notification.TYPE_REQUEST}: ${notification.type == Notification.TYPE_REQUEST ? enterprise.totalRequestNotifications + 1 : enterprise.totalRequestNotifications}
//                 `
//             );
//           })
//           .catch((error) => {
//             return console.log(error);
//           });
//   });



// exports.checkExpiredLicensesAndNotify5DaysBefore = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
//     const now = new Date();
//     // Get range of dates to filter documents
//     const fiveDaysLaterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5);
//     const fiveDaysLaterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6);

//     const startTimestamp = fiveDaysLaterStart.getTime();
//     const endTimestamp = fiveDaysLaterEnd.getTime();

//     const firestore = admin.firestore();
//     const licenseRef = firestore.collection('license');
//     // Search for licenses that expires inside the range
//     const expiredLicensesSnapshot = await licenseRef
//         .where('currentPeriodEnd', '>=', startTimestamp)
//         .where('currentPeriodEnd', '<', endTimestamp)
//         .get();

//     if (expiredLicensesSnapshot.empty) {
//         console.log('No matching licenses found.');
//         return null;
//     }

//     const batch = firestore.batch();

//     expiredLicensesSnapshot.docs.forEach(doc => {
//         const licenseData = doc.data();
//         const notificationRef = firestore.collection('notifications').doc();
//         const notification = {
//             id: notificationRef.id,
//             message: "tiene una licencia que expira en 5 dias.",
//             date: +new Date(),
//             readByUser: null,
//             clearByUser: null,
//             userRef: null, 
//             enterpriseRef: licenseData.enterpriseRef, 
//             type: "alert",
//             subType: "pending"
//         };

//         batch.set(notificationRef, notification);
//     });

//     await batch.commit();

//     console.log(`Notifications created for licenses expiring in 5 days.`);
// });

export const checkExpiredSubscriptionsAndNotify5DaysBefore = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = new Date();
    // Get range of dates to filter documents
    const fiveDaysLaterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5);
    const fiveDaysLaterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6);

    const startTimestamp = fiveDaysLaterStart.getTime();
    const endTimestamp = fiveDaysLaterEnd.getTime();

    const subscriptionRef = admin.firestore().collection('subscription');
    // Search for subscriptions that expires inside the range
    const expiringSubscriptionsSnapshot = await subscriptionRef
    .where('currentPeriodEnd', '>=', startTimestamp)
    .where('currentPeriodEnd', '<', endTimestamp)
    .get();

    if (expiringSubscriptionsSnapshot.empty) {
        console.log('No matching subscriptions found.');
        return null;
    }

    const batch = admin.firestore().batch();

    expiringSubscriptionsSnapshot.docs.forEach(doc => {
        const subscriptionData = doc.data();
        const notificationRef = admin.firestore().collection('notification').doc();
        const notification = {
            id: notificationRef.id,
            message: "tiene una suscripción que expira en 5 dias.",
            date: +new Date(),
            readByUser: null,
            clearByUser: null,
            userRef: subscriptionData.userRef,
            enterpriseRef: subscriptionData.enterpriseRef,
            type: "alert",
            subType: "pending"
        };

        batch.set(notificationRef, notification);
    });

    // Execute batch
    return batch.commit().then(() => {
        console.log('Notifications created for subscriptions expiring in 5 days.');
    }).catch(error => {
        console.error('Error creating notifications ', error);
    });

});