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