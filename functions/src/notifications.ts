import * as functions from 'firebase-functions';
// import { Notification } from '../../src/shared/models/notification.model'
// import { Enterprise } from '../../src/shared/models/enterprise.model'
import * as admin from 'firebase-admin';
import { DocumentReference } from 'firebase-admin/firestore';

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
        return
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

export const checkDelayedStudyPlans = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = new Date();

    const coursesByStudentRef = admin.firestore().collection('coursesByStudent');
    const delayedCoursesByStudentSnapshot = await coursesByStudentRef
    .where('active', '==', true)
    .where('dateEndPlan', '<', now)
    .where('dateEnd', '==', null)
    .get();

    if (delayedCoursesByStudentSnapshot.empty) { console.log('No matching courses found.'); return}

    // Set() to store uniques userRefs. We just need to create 1 notification per study plan, not course
    const usersWithDelayedCourses = new Set<DocumentReference>();
    delayedCoursesByStudentSnapshot.docs.forEach(doc => {
        const data = doc.data();
        usersWithDelayedCourses.add(data.userRef);
        console.log("Users delayed", data.userRef.path)
    });

    if (usersWithDelayedCourses.size === 0) { console.log('No users with delayed courses.'); return }

    const notificationCollection = admin.firestore().collection('notification');
    const batch = admin.firestore().batch();

    for (const userRef of usersWithDelayedCourses) {
        // Verify if a delayed notification for the user already exists
        const existingNotificationSnapshot = await notificationCollection
            .where('userRef', '==', userRef)
            .where('subType', '==', 'delayed')
            .limit(1)
            .get();
        if (!existingNotificationSnapshot.empty) { console.log(`Notification already exists for user: ${userRef.path}`); continue }
        
        const userSnapshot = await userRef.get();
        if (!userSnapshot.exists) { console.log(`User document does not exist for ref: ${userRef.path}`); continue }

        const userData = userSnapshot.data();
        const enterpriseRef = userData?.enterprise;
        if (!enterpriseRef) { console.log(`Enterprise reference not found for user: ${userRef.path}`); continue }

        const notificationRef = notificationCollection.doc();
        const notification = {
            message: "esta atrasado en su plan de estudios.",
            date: +new Date(),
            readByUser: null,
            clearByUser: null,
            userRef: userRef,
            enterpriseRef: enterpriseRef,
            type: "alert",
            subType: "delayed"
        };

        batch.set(notificationRef, notification);
    };

    return batch.commit().then(() => {
        console.log(`notifications created for users with delayed study plans.`);
    }).catch(error => {
        console.error('Error processing notifications', error);
    });
});

export const checkCompletedStudyPlans = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = new Date();

    const activeCoursesSnapshot = await admin.firestore().collection('coursesByStudent')
        .where('active', '==', true)
        .get();

    if (activeCoursesSnapshot.empty) {
        console.log('No active courses found.');
        return;
    }

    // Object to store users and completion indicator
    const userCompletionStatus: Record<string, boolean> = {};

    for (const doc of activeCoursesSnapshot.docs) {
        const data = doc.data();
        const userId = data.userRef.id;

        // The first time we find a user, initialized it as studyPlan completed
        if (userCompletionStatus[userId] === undefined) {
            userCompletionStatus[userId] = true;
        }

        // DEBUGG. DELETE IT
        if (data.dateEnd) { console.log("Este curso esta completado", data.courseRef.path, "user", userId)}


        // If one course is not completed, set as incompleted
        if (!data.dateEnd) {
            userCompletionStatus[userId] = false;
        }
    }

    // DEBUGG. DELETE IT
    console.log("usuarios y status de completacion", userCompletionStatus)

    // Filter just users with completed study plans. Returns an array of userIds
    const usersWithCompletedPlans = Object.entries(userCompletionStatus)
        .filter(([userId, isCompleted]) => isCompleted)
        .map(([userId, isCompleted]) => userId);

    // DEBUGG. DELETE IT
    console.log("usuarios con studyplan completado", usersWithCompletedPlans)

    if (usersWithCompletedPlans.length === 0) {
        console.log('No users with completed study plans.');
        return;
    }

    const batch = admin.firestore().batch();

    for (const userId of usersWithCompletedPlans) {
        const userRef = admin.firestore().collection('user').doc(userId);
        // Verify if a completed notification for the user already exists
        const existingNotificationSnapshot = await admin.firestore().collection('notification')
            .where('userRef', '==', userRef)
            .where('subType', '==', 'succeded')
            .limit(1)
            .get();
        if (!existingNotificationSnapshot.empty) { console.log(`Notification already exists for user: ${userRef.path}`); continue }
        
        const userSnapshot = await userRef.get();
        if (!userSnapshot.exists) { console.log(`User document does not exist for ref: ${userRef.path}`); continue }
        const userData = userSnapshot.data();
        const enterpriseRef = userData?.enterprise;
        if (!enterpriseRef) { console.log(`Enterprise reference not found for user: ${userRef.path}`); continue }

        const notificationRef = admin.firestore().collection('notification').doc();
        const notification = {
            message: "ha completado su plan de estudios.",
            date: +new Date(),
            readByUser: null,
            clearByUser: null,
            userRef: userRef,
            enterpriseRef: enterpriseRef,
            type: "event",
            subType: "succeded"
        };

        batch.set(notificationRef, notification);
    }

    return batch.commit().then(() => {
        console.log(`${usersWithCompletedPlans.length} notifications created for users with completed study plans.`);
    }).catch(error => {
        console.error('Error processing notifications', error);
    });
});