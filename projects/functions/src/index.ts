import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);
// admin.initializeApp();

import { onActivityUpdated } from './activity';
export { onActivityUpdated }


import { updateDataEnterpriseUsage,updateDataAllEnterprisesUsage,updateDataAllEnterprisesUsageSchedule,updateDataEnterpriseRhythm,updateDataAllEnterprisesRhythm,updateDataAllEnterprisesRhythmSchedule,updateDataEnterpriseProgressPlan,updateAllDataEnterpriseProgressPlan,updateAllDataEnterpriseProgressPlanSchedule} from './enterprise';
export { updateDataEnterpriseUsage,updateDataAllEnterprisesUsage,updateDataAllEnterprisesUsageSchedule,updateDataEnterpriseRhythm,updateDataAllEnterprisesRhythm,updateDataAllEnterprisesRhythmSchedule,updateDataEnterpriseProgressPlan,updateAllDataEnterpriseProgressPlan,updateAllDataEnterpriseProgressPlanSchedule}



import { createUserWithEmailAndPassword,deleteUser, generatePasswordResetLink, emptyDatabase,createInstructorWithEmailAndPassword,rememberInstructorWithEmailAndPassword } from './authentication';
export { createUserWithEmailAndPassword,deleteUser, generatePasswordResetLink, emptyDatabase,createInstructorWithEmailAndPassword,rememberInstructorWithEmailAndPassword }

import { createTractianUser } from './tractian';
export { createTractianUser }

import { getArticlesSlug, api } from './articles';
export { getArticlesSlug, api }

import { sendMail,sendMailHTML } from './email';
export { sendMail,sendMailHTML }

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

import { sendLiveCourseEmail, } from './live-course'
export { sendLiveCourseEmail, }

import { mailAccountManagementAdmin,mailAccountManagementUsers,generateReportsAdminAllEnterprisesMnual,generateReportsUsersAllEnterprisesMnual } from './reports'
export { mailAccountManagementAdmin,mailAccountManagementUsers,generateReportsAdminAllEnterprisesMnual,generateReportsUsersAllEnterprisesMnual }

import { generateMailCertificate } from './certificado'
export { generateMailCertificate }

import { getAllCourseIds, onCourseUpdated, onCourseCreated }  from './course'
export { getAllCourseIds, onCourseUpdated, onCourseCreated }

import { getAllFreebiesIds, onFreebieUpdated }  from './freebies'
export { getAllFreebiesIds, onFreebieUpdated }

import { getRoyaltiesInstructor } from './royalties'
export { getRoyaltiesInstructor }

import { sendEmailQuestionInstructor } from './questions'
export { sendEmailQuestionInstructor }
