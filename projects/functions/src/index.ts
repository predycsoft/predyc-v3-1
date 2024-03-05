import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);
// admin.initializeApp();

import { onActivityUpdated } from './activity';
export { onActivityUpdated }

import { createUserWithEmailAndPassword, generatePasswordResetLink, emptyDatabase } from './authentication';
export { createUserWithEmailAndPassword, generatePasswordResetLink, emptyDatabase }

import { createTractianUser } from './tractian';
export { createTractianUser }

import { sendMail } from './email';
export { sendMail }

// import { createProfilesFromExcel } from './handleExcel';
// export { createProfilesFromExcel }

// import { onNotificationAdded, onNotificationReadByAdmin } from './notifications'
// export { onNotificationAdded, onNotificationReadByAdmin }


import { onUserAdded, onUserDeleted, onUserUpdated } from './users'
export { onUserAdded, onUserDeleted, onUserUpdated }

import { onProfileAdded, } from './profile'
export { onProfileAdded, }

import { checkExpiredLicenses, } from './license'
export { checkExpiredLicenses, }

import { checkExpiredSubscriptions, } from './subscription'
export { checkExpiredSubscriptions, }

import { checkExpiredSubscriptionsAndNotify5DaysBefore, checkDelayedStudyPlans, checkCompletedStudyPlans } from './notifications'
export { checkExpiredSubscriptionsAndNotify5DaysBefore, checkDelayedStudyPlans, checkCompletedStudyPlans }