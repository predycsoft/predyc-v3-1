import { Component } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { LicenseService } from 'projects/predyc-business/src/shared/services/license.service';
import { LoggingService } from 'projects/predyc-business/src/shared/services/logging.service';
import { SubscriptionService } from 'projects/predyc-business/src/shared/services/subscription.service';
import { ComponentLog } from 'projects/shared/models/component-log.model';
import { CourseByStudent } from 'projects/shared/models/course-by-student.model';
import { Subscription } from 'projects/shared/models/subscription.model';
import { Notification } from 'projects/shared/models/notification.model';
import { firestoreTimestampToNumberTimestamp } from 'projects/shared/utils';
import { User } from 'projects/shared/models/user.model';
import { License } from 'projects/shared/models/license.model';
import { Curso } from 'projects/shared/models/course.model';
import { Enterprise } from 'projects/shared/models/enterprise.model';

export interface GroupedLogs {
  componentName: string;
  componentsData: ComponentLog[];
  totalReadCount: number; // New field
}


@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent {
  constructor(
    private loggingService: LoggingService,
    //
    private afs: AngularFirestore,
    private subscriptionService: SubscriptionService,
    private licenseService: LicenseService,

  ) {}

  groupedLogs: GroupedLogs[] = [];
  filteredLogs: GroupedLogs[] = [];
  customDate: any;
  selectedOption = 'Seleccionar dia';

  async ngOnInit() {
    const logsData: ComponentLog[] = await this.loggingService.getLogs();
    // console.log("logsData", logsData)
    logsData.forEach(log => {
      if (log.date) {
        log.date = firestoreTimestampToNumberTimestamp(log.date) as number;
      }
    });
    this.groupedLogs = Object.values(
      logsData.reduce((acc, log) => {
        const { componentName, readOperationsCount } = log;
        if (!acc[componentName]) {
          acc[componentName] = {
            componentName,
            componentsData: [],
            totalReadCount: 0
          };
        }
        acc[componentName].componentsData.push(log);
        acc[componentName].totalReadCount += readOperationsCount;
        return acc;
      }, {} as { [key: string]: GroupedLogs })
    );
    
    // console.log("this.groupedLogs", this.groupedLogs)
  }

  onOptionChange() {
    switch (this.selectedOption) {
      case 'Seleccionar dia':
        this.customDate = null
        this.filteredLogs = [];
        break;
      case 'Ultimos 7 dias':
        this.filterLastNDays(7);
        break;
      case 'Mes actual':
        this.monthSelected();
        break;
      case 'Todos':
        this.filteredLogs = [...this.groupedLogs];
        console.log("this.filteredLogs", this.filteredLogs)
        break;
    }
  }

  onCustomDateChange() {
    if (!this.customDate) return;
    
    const [year, month, day] = this.customDate.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day).getTime();
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();

    this.filteredLogs = this.groupedLogs.map(group => ({
      ...group,
      componentsData: group.componentsData.filter(log => log.date >= startOfDay && log.date <= endOfDay)
    })).filter(group => group.componentsData.length > 0);

    console.log("this.filteredLogs", this.filteredLogs)
  
    this.calculateTotalReadCountForFilteredLogs();
  }

  filterLastNDays(days: number) {
    const now = Date.now();
    const startDate = now - days * 24 * 60 * 60 * 1000;

    this.filteredLogs = this.groupedLogs.map(group => ({
      ...group,
      componentsData: group.componentsData.filter(log => log.date >= startDate && log.date <= now)
    })).filter(group => group.componentsData.length > 0);

    this.calculateTotalReadCountForFilteredLogs();
  }
  
  monthSelected() {
    const today = new Date();
  
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    // Filter logs within the current month
    this.filteredLogs = this.groupedLogs.map(group => ({
      ...group,
      componentsData: group.componentsData.filter(log => log.date >= startOfMonth && log.date <= endOfMonth)
    })).filter(group => group.componentsData.length > 0);
  
    this.calculateTotalReadCountForFilteredLogs();
  }
  
  calculateTotalReadCountForFilteredLogs() {
    this.filteredLogs.forEach(group => {
      group.totalReadCount = group.componentsData.reduce((sum, log) => sum + (log.readOperationsCount || 0), 0);
    });
    console.log("Filtered totalReadCount recalculated:", this.filteredLogs);
  }
  

  // ----------------- Debug 
  async getCollectionsDocumentsCount() {

    // this.debugCheckExpiredSubscriptionsAndNotify5DaysBefore()
    // this.debugAllLicenses()
    // this.debugCheckDelayedStudyPlans()
    // this.debugCheckCompletedStudyPlans()
    // this.debugCheckExpiredSubscriptions()
    this.debugUpdateAllDataEnterpriseProgressPlanSchedule()

  }

  async debugCheckExpiredSubscriptionsAndNotify5DaysBefore() {
    // XXXXXXX checkExpiredSubscriptionsAndNotify5DaysBefore
    console.log("checkExpiredSubscriptionsAndNotify5DaysBefore")
    const now = new Date();
    const fiveDaysLaterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5);
    const fiveDaysLaterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6);
    const startTimestamp = fiveDaysLaterStart.getTime();
    const endTimestamp = fiveDaysLaterEnd.getTime();
    const expiringSubscriptionsSnapshot = await this.afs.collection(Subscription.collection).ref
    .where('currentPeriodEnd', '>=', startTimestamp)
    .where('currentPeriodEnd', '<', endTimestamp)
    .get();
    const expiringSubscriptionsCount = expiringSubscriptionsSnapshot.size
    console.log("expiringSubscriptionsCount", expiringSubscriptionsCount)
    console.log("--------------")
  }

  async debugAllLicenses() {
    // XXXXXXX All licenses
    const licenses = await this.licenseService.getAllLicensesWithReadCount()
    console.log("licenses.readCount", licenses.readCount)
    console.log("--------------")
  }

  async debugCheckDelayedStudyPlans() {
    let readCount = 0;
    const now = new Date();
    console.log("checkDelayedStudyPlans")
  
    const delayedCoursesByStudentSnapshot = await this.afs.collection(CourseByStudent.collection).ref
    .where('active', '==', true)
    .where('dateEndPlan', '<', now)
    .where('dateEnd', '==', null)
    .get();
    // const delayedCoursesByStudent = delayedCoursesByStudentSnapshot.docs.map(doc => doc.data() as CourseByStudent);
    const delayedCoursesByStudentCount = delayedCoursesByStudentSnapshot.size
    console.log("delayedCoursesByStudentCount", delayedCoursesByStudentCount)
    readCount += delayedCoursesByStudentCount; // Increment for each document read in this query
  
    // Set() to store uniques userRefs. We just need to create 1 notification per study plan, not course
    const usersWithDelayedCourses = new Set<DocumentReference>();
    delayedCoursesByStudentSnapshot.docs.forEach(doc => {
        const data = doc.data() as CourseByStudent;
        usersWithDelayedCourses.add(data.userRef);
        // console.log("Users delayed", data.userRef.path)
    });
  
    if (usersWithDelayedCourses.size === 0) { 
      console.log('No users with delayed courses.'); 
      console.log(`Total read operations: ${readCount}`);
      return;
    }
    const notificationCollection = this.afs.collection('notification');
    console.log("usersWithDelayedCourses", usersWithDelayedCourses)
    for (const userRef of usersWithDelayedCourses) {
      console.log("---userRef", userRef)
      // Verify if a delayed notification for the user already exists
      const existingNotificationSnapshot = await notificationCollection.ref
          .where('userRef', '==', userRef)
          .where('subType', '==', 'delayed')
          .limit(1)
          .get();
      if (!existingNotificationSnapshot.empty) { 
        readCount += existingNotificationSnapshot.size
        // console.log(`Notification already exists for user: ${userRef.path}`); 
        continue 
      }
      
      const userSnapshot = await userRef.get();
      
      if (!userSnapshot.exists) { 
        // console.log(`User document does not exist for ref: ${userRef.path}`); 
        continue 
      }
      readCount += 1; // Increment for reading the user 
  
    };
    console.log(`Total read operations: ${readCount}`);
    console.log("--------------")
  }

  async debugCheckCompletedStudyPlans() {
    let readCount = 0;
    console.log("checkCompletedStudyPlans")

    const activeCoursesSnapshot = await this.afs.collection('coursesByStudent').ref
      .where('active', '==', true)
      .get();
    readCount += activeCoursesSnapshot.size; // Increment for each document read in this query

    console.log("active courses by student count", readCount)

    if (activeCoursesSnapshot.empty) {
        console.log('No active courses found.');
        console.log(`Total read operations: ${readCount}`);
        return;
    }

    const userCompletionStatus: Record<string, boolean> = {};

    for (const doc of activeCoursesSnapshot.docs) {
        const data = doc.data() as CourseByStudent;
        const userId = data.userRef.id;

        if (userCompletionStatus[userId] === undefined) {
            userCompletionStatus[userId] = true;
        }

        if (!data.dateEnd) {
            userCompletionStatus[userId] = false;
        }
    }

    const usersWithCompletedPlans = Object.entries(userCompletionStatus)
        .filter(([userId, isCompleted]) => isCompleted)
        .map(([userId, isCompleted]) => userId);

    if (usersWithCompletedPlans.length === 0) {
        console.log('No users with completed study plans.');
        console.log(`Total read operations: ${readCount}`);
        return;
    }
    console.log("usersWithCompletedPlans", usersWithCompletedPlans)

    for (const userId of usersWithCompletedPlans) {
        const userRef = this.afs.collection('user').doc(userId).ref;
        // Verify if a completed notification for the user already exists
        const existingNotificationSnapshot = await this.afs.collection('notification').ref
            .where('userRef', '==', userRef)
            .where('subType', '==', 'succeded')
            .limit(1)
            .get();
        
        console.log("existingNotificationSnapshot.size", existingNotificationSnapshot.size)
        
        readCount += 1;
        
        const userSnapshot = await userRef.get();
        readCount += 1; // Increment for the user document read

        if (!userSnapshot.exists) { 
          // console.log(`User document does not exist for ref: ${userRef.path}`); 
          continue 
        }
        const userData = userSnapshot.data() as User;

    }
    console.log(`Total read operations: ${readCount}`);
  }

  async debugCheckExpiredSubscriptions() {
    // XXXXXXx checkExpiredSubscriptions
    const now = +new Date();
    const subscriptionRef = this.afs.collection(Subscription.collection).ref;
    const snapshot = await subscriptionRef.where('currentPeriodEnd', '<', now).get();

    console.log("snapshot.size", snapshot.size)
  }

  async debugUpdateAllDataEnterpriseProgressPlanSchedule() {
    console.log("debugUpdateAllDataEnterpriseProgressPlanSchedule")
    let readCount = 0
    const licensesSnapshot = await this.afs.collection(License.collection).ref.where('status', '==', 'active').get();
    // readCount += licensesSnapshot.size; // Increment read count for licenses

    const enterpriseRefs = new Set<DocumentReference>();
    const enterpriseIds = new Set<string>();

    licensesSnapshot?.forEach(doc => {
      const licenseData = doc.data() as any;
      if (licenseData?.enterpriseRef) {
        enterpriseRefs.add(licenseData.enterpriseRef);
        enterpriseIds.add(licenseData.enterpriseRef.id);
      }
    });

    const uniqueEnterpriseRefs = Array.from(enterpriseRefs);
    const uniqueEnterpriseIds = Array.from(enterpriseIds);
    console.log("uniqueEnterpriseIds", uniqueEnterpriseIds)

    for (const enterpriseId of uniqueEnterpriseIds) {
      const enterpriseRef = this.afs.collection(Enterprise.collection).doc(enterpriseId).ref;
      // Verificar si la referencia de la empresa existe
      const enterpriseDoc = await enterpriseRef.get();
      // readCount += 1; // Increment for enterprise document read
      if (!enterpriseDoc.exists) {
        console.log(`Enterprise with ID ${enterpriseId} does not exist.`);
        continue;
      }
      console.log(`Editing enterprise ID ${enterpriseId}.`);
      const usersSnapshot = await this.afs.collection(User.collection).ref
      .where('enterprise', '==', enterpriseRef)
      .where('status', '==', 'active') // Filtrar usuarios con status active
      .get();
      console.log("usersSnapshot.size", usersSnapshot.size)
      readCount += usersSnapshot.size; // Increment for user documents read

      const userRefs = usersSnapshot.docs.map(doc => doc.ref);
    
      // Buscar cursos que coincidan con la empresa o que tengan enterpriseRef null
      const coursesSnapshot = await this.afs.collection(Curso.collection).ref
        .where('enterpriseRef', '==', enterpriseRef)
        .get();
      readCount += coursesSnapshot.size; // Increment for course documents read
    
      const nullCoursesSnapshot = await this.afs.collection(Curso.collection).ref
        .where('enterpriseRef', '==', null)
        .get();
      readCount += nullCoursesSnapshot.size; // Increment for course documents with null enterpriseRef
    
      // Unir los cursos con enterpriseRef igual al enterpriseRef de la empresa y los que tienen enterpriseRef null
      const courses = coursesSnapshot.docs.map(doc => doc.data()).concat(nullCoursesSnapshot.docs.map(doc => doc.data()));
    
      // Dividir userRefs en grupos de 10
      const chunks = [];
      for (let i = 0; i < userRefs.length; i += 10) {
        chunks.push(userRefs.slice(i, i + 10));
      }
      // Obtener coursesByStudent para los usuarios en chunks
      let allCoursesByStudent = [];
      for (const chunk of chunks) {
        const coursesByStudentSnapshot = await this.afs.collection(CourseByStudent.collection).ref
          .where('userRef', 'in', chunk)
          .where('isExtraCourse', '==', false)
          .where('active', '==', true)
          .get();
        readCount += coursesByStudentSnapshot.size; // Increment for coursesByStudent documents read
        allCoursesByStudent = allCoursesByStudent.concat(coursesByStudentSnapshot.docs.map(doc => doc.data()));
      }
      console.log("allCoursesByStudent.length", allCoursesByStudent.length)
    }
    console.log(`Total read operations: ${readCount}`);
  }
  
}

