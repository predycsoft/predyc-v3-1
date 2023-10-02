import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);
// admin.initializeApp();

import { createUserWithEmailAndPassword } from './authentication';
export { createUserWithEmailAndPassword }

import { onNotificationAdded, onNotificationReadByAdmin } from './notifications'
export { onNotificationAdded, onNotificationReadByAdmin }

import { sendMail } from './email';
export { sendMail }

import { onUserAdded, onUserDeleted, onUserUpdated } from './users'
export { onUserAdded, onUserDeleted, onUserUpdated }