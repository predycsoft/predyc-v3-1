import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);
// admin.initializeApp();

import { onActivityUpdated } from './activity';
export { onActivityUpdated }

import { createUserWithEmailAndPassword } from './authentication';
export { createUserWithEmailAndPassword }

import { sendMail } from './email';
export { sendMail }

// import { onNotificationAdded, onNotificationReadByAdmin } from './notifications'
// export { onNotificationAdded, onNotificationReadByAdmin }


import { onUserAdded, onUserDeleted, onUserUpdated } from './users'
export { onUserAdded, onUserDeleted, onUserUpdated }

import { onProfileAdded, } from './profile'
export { onProfileAdded, }