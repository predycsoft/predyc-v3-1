import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);
// admin.initializeApp();

import { onActivityUpdated } from './activity';
export { onActivityUpdated }

import { updateDataEnterpriseUsage,updateDataAllEnterprisesUsage,updateDataAllEnterprisesUsageSchedule,updateDataEnterpriseRhythm,updateDataAllEnterprisesRhythm,updateDataAllEnterprisesRhythmSchedule,updateDataEnterpriseProgressPlan,updateAllDataEnterpriseProgressPlan,updateAllDataEnterpriseProgressPlanSchedule,updateAllDataEnterpriseMonthlyClasses} from './enterprise';
export { updateDataEnterpriseUsage,updateDataAllEnterprisesUsage,updateDataAllEnterprisesUsageSchedule,updateDataEnterpriseRhythm,updateDataAllEnterprisesRhythm,updateDataAllEnterprisesRhythmSchedule,updateDataEnterpriseProgressPlan,updateAllDataEnterpriseProgressPlan,updateAllDataEnterpriseProgressPlanSchedule,updateAllDataEnterpriseMonthlyClasses}

import { createUserWithEmailAndPassword,deleteUser, generatePasswordResetLink, emptyDatabase,createInstructorWithEmailAndPassword,rememberInstructorWithEmailAndPassword } from './authentication';
export { createUserWithEmailAndPassword,deleteUser, generatePasswordResetLink, emptyDatabase,createInstructorWithEmailAndPassword,rememberInstructorWithEmailAndPassword }

import { createTractianUser } from './tractian';
export { createTractianUser }

import { getArticlesSlug, getPredictivaArticlesSlug, getPredycArticlesSlug, api } from './articles';
export { getArticlesSlug, getPredictivaArticlesSlug, getPredycArticlesSlug, api }

import { sendMail,sendMailHTML } from './email';
export { sendMail,sendMailHTML }

// import { createProfilesFromExcel } from './handleExcel';
// export { createProfilesFromExcel }

// import { onNotificationAdded, onNotificationReadByAdmin } from './notifications'
// export { onNotificationAdded, onNotificationReadByAdmin }


import { onUserAdded, onUserDeleted, onUserUpdated,createUserDocument } from './users'
export { onUserAdded, onUserDeleted, onUserUpdated,createUserDocument }

import { onProfileAdded, } from './profile'
export { onProfileAdded, }

import { checkExpiredLicenses, } from './license'
export { checkExpiredLicenses, }

import { checkExpiredSubscriptions, } from './subscription'
export { checkExpiredSubscriptions, }

import { checkExpiredSubscriptionsAndNotify5DaysBefore, checkCompletedStudyPlans, checkDelayedStudyPlansFromYesterday, checkAllDelayedStudyPlans } from './notifications'
export { checkExpiredSubscriptionsAndNotify5DaysBefore, checkCompletedStudyPlans, checkDelayedStudyPlansFromYesterday, checkAllDelayedStudyPlans }

import { sendLiveCourseEmail, } from './live-course'
export { sendLiveCourseEmail, }

import { mailAccountManagementAdmin,mailAccountManagementUsers,generateReportsAdminAllEnterprisesMnual,generateReportsUsersAllEnterprisesMnual,generateReportsAdminAllEnterprisesSchedule,generateReportsUsersAllEnterprisesSchedule } from './reports'
export { mailAccountManagementAdmin,mailAccountManagementUsers,generateReportsAdminAllEnterprisesMnual,generateReportsUsersAllEnterprisesMnual,generateReportsAdminAllEnterprisesSchedule,generateReportsUsersAllEnterprisesSchedule }

import { generateMailCertificate } from './certificado'
export { generateMailCertificate }
 
import { getAllCourseIds, getAllP21CourseIds, onCourseUpdated, onCourseCreated, updateStudentQtyEndpoint, updateStudentQty }  from './course'
export { getAllCourseIds, getAllP21CourseIds, onCourseUpdated, onCourseCreated, updateStudentQtyEndpoint, updateStudentQty }

import { getAllFreebiesIds, onFreebieUpdated }  from './freebies'
export { getAllFreebiesIds, onFreebieUpdated }

import { getRoyaltiesInstructor } from './royalties'
export { getRoyaltiesInstructor }

import { sendEmailQuestionInstructor } from './questions'
export { sendEmailQuestionInstructor }

import { valorarCurso2,valorarCursoLive } from './progress'
export { valorarCurso2,valorarCursoLive }

import { createEventCertificate } from './events'
export { createEventCertificate }


//