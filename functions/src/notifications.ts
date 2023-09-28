import * as functions from 'firebase-functions';
// import { Notification } from '../../src/app/shared/models/notification.model'
// import { Enterprise } from '../../src/app/shared/models/enterprise.model'
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const onNotificationAdded = functions.firestore
  .document('notification/{doc}')
  .onCreate(async (snap, _) => {
    const notification = snap.data()
    if (!notification.enterpriseRef) {
        return
    }
    const enterprise = (await notification.enterpriseRef.get()).data()
    let fieldToIncrement: string = ''
    switch (notification.type) {
        case 'activity':
            fieldToIncrement = 'totalActivityNotifications'
            break;
        case 'alert':
            fieldToIncrement = 'totalAlertNotifications'
            break;
        case 'request':
            fieldToIncrement = 'totalRequestNotifications'
            break;
    }
    return db
          .collection('enterprise')
          .doc(enterprise.id)
          .update({
            [fieldToIncrement]: admin.firestore.FieldValue.increment(1)
          })
          .then(() => {
            return console.log(
                `Updated enterprise: ${enterprise.name} notifications quantity to:
                    ${'activity'}: ${notification.type == 'activity' ? enterprise.totalActivityNotifications + 1 : enterprise.totalActivityNotifications}
                    ${'alert'}: ${notification.type == 'alert' ? enterprise.totalAlertNotifications + 1 : enterprise.totalAlertNotifications}
                    ${'request'}: ${notification.type == 'request' ? enterprise.totalRequestNotifications + 1 : enterprise.totalRequestNotifications}
                `
            );
          })
          .catch((error) => {
            return console.log(error);
          });
  });

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