import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ClassByStudent, CourseByStudent, Curso, Enterprise, License, StudyPlanClass, User,getMonthProgress,getPerformanceWithDetails, obtenerUltimoDiaDelMes, obtenerUltimoDiaDelMesAnterior } from 'shared';

const db = admin.firestore();


export const updateDataEnterpriseProgressPlan = functions.https.onCall(async (data, _) => {
  try {
    const batch = admin.firestore().batch();
    const enterpriseId = data.enterpriseId;
    console.log(`Actualización empresas ${enterpriseId}`)
    await updateDataEnterpriseProgressPlanLocal(enterpriseId,batch)
    await batch.commit();
    console.log(`Actualización empresas end${enterpriseId}`)
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

export const updateAllDataEnterpriseProgressPlan = functions.https.onCall(async () => {
  try {
    console.log('updateDataAllEnterprisesUsageStart')
    await updateDataAllEnterprisesProgressPlanLocal();
    console.log('updateDataAllEnterprisesUsageEnd')
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

export const updateDataEnterpriseUsage = functions.https.onCall(async (data, _) => {
  try {
    
    const batch = admin.firestore().batch();
    const enterpriseId = data.enterpriseId;
    console.log(`Actualización empresas ${enterpriseId}`)
    await updateDataEnterpriseUsageLocal(enterpriseId,batch)
    await batch.commit();
    console.log(`Actualización empresas ${enterpriseId}`)
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});


export const updateDataEnterpriseRhythm = functions.https.onCall(async (data, _) => {
  try {
    const batch = admin.firestore().batch();
    const enterpriseId = data.enterpriseId;
    await updateDataEnterpriseRhythmLocal(enterpriseId,batch)
    await batch.commit();
    console.log(`Actualización empresas ${enterpriseId}`)
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});


export const updateAllDataEnterpriseProgressPlanSchedule = functions.pubsub.schedule('every day 06:00').onRun(async (context) => {
  try {
    await updateDataAllEnterprisesProgressPlanLocal();
    console.log('Updated all enterprises usage');
  } catch (error) {
    console.error('Error updating all enterprises usage:', error);
  }
});


export const updateDataAllEnterprisesUsageSchedule = functions.pubsub.schedule('every monday 06:00').onRun(async (context) => {
  try {
    await updateDataAllEnterprisesUsageLocal();
    console.log('Updated all enterprises usage');
  } catch (error) {
    console.error('Error updating all enterprises usage:', error);
  }
});

export const updateDataAllEnterprisesRhythmSchedule = functions.pubsub.schedule('every day 06:00').onRun(async (context) => {
  try {
    await updateDataAllEnterprisesRhythmLocal();
    console.log('Updated all enterprises usage');
  } catch (error) {
    console.error('Error updating all enterprises usage:', error);
  }
});

export const updateDataAllEnterprisesUsage = functions.https.onCall(async () => {
  try {
    console.log('updateDataAllEnterprisesUsageStart')
    await updateDataAllEnterprisesUsageLocal();
    console.log('updateDataAllEnterprisesUsageEnd')
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});


export const updateDataAllEnterprisesRhythm = functions.https.onCall(async () => {
  try {
    console.log('updateDataAllEnterprisesRhythmStart')
    await updateDataAllEnterprisesRhythmLocal();
    console.log('updateDataAllEnterprisesRhythmEnd')
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

async function updateDataAllEnterprisesRhythmLocal() {
  const batch = admin.firestore().batch();
  
  try {
    const licensesSnapshot = await admin.firestore().collection(License.collection).where('status', '==', 'active').get();
    const enterpriseRefs = new Set<FirebaseFirestore.DocumentReference>();
    const enterpriseIds = new Set<string>();


    licensesSnapshot?.forEach(doc => {
      const licenseData = doc.data();
      if (licenseData?.enterpriseRef) {
        enterpriseRefs.add(licenseData.enterpriseRef);
        enterpriseIds.add(licenseData.enterpriseRef.id);
      }
    });
    const uniqueEnterpriseRefs = Array.from(enterpriseRefs);
    const uniqueEnterpriseIds = Array.from(enterpriseIds);

    for (const enterpriseId of uniqueEnterpriseIds) {
      await updateDataEnterpriseRhythmLocal(enterpriseId, batch);
    }

    await batch.commit();
    console.log('Actualización completada para todas las empresas.');

  } catch (error: any) {
    console.log(error);
    throw new Error(error.message);
  }
}


async function updateDataAllEnterprisesUsageLocal() {
  const batch = admin.firestore().batch();
  
  try {
    const licensesSnapshot = await admin.firestore().collection(License.collection).where('status', '==', 'active').get();
    const enterpriseRefs = new Set<FirebaseFirestore.DocumentReference>();
    const enterpriseIds = new Set<string>();


    licensesSnapshot?.forEach(doc => {
      const licenseData = doc.data();
      if (licenseData?.enterpriseRef) {
        enterpriseRefs.add(licenseData.enterpriseRef);
        enterpriseIds.add(licenseData.enterpriseRef.id);
      }
    });

    const uniqueEnterpriseRefs = Array.from(enterpriseRefs);
    const uniqueEnterpriseIds = Array.from(enterpriseIds);

    for (const enterpriseId of uniqueEnterpriseIds) {
      await updateDataEnterpriseUsageLocal(enterpriseId, batch);
    }

    await batch.commit();
    console.log('Actualización completada para todas las empresas.');

  } catch (error: any) {
    console.log(error);
    throw new Error(error.message);
  }
}

async function updateDataEnterpriseRhythmLocal(enterpriseId: string,batch?: FirebaseFirestore.WriteBatch) {

  try{

  const enterpriseRef = admin.firestore().collection(Enterprise.collection).doc(enterpriseId);
    
  // Verificar si la referencia de la empresa existe
  const enterpriseDoc = await enterpriseRef.get();
  if (!enterpriseDoc.exists) {
    console.log(`Enterprise with ID ${enterpriseId} does not exist.`);
    return;
  }

  console.log(`Editing enterprise ID ${enterpriseId}.`);

  const usersSnapshot = await admin.firestore().collection(User.collection)
  .where('enterprise', '==', enterpriseRef)
  .where('status', '==', 'active') // Filtrar usuarios con status active
  .get();

  const users: FirebaseFirestore.DocumentData[] = usersSnapshot.docs.map(doc => doc.data());

  const userRefs = usersSnapshot.docs.map(doc => doc.ref);

  // Buscar cursos que coincidan con la empresa o que tengan enterpriseRef null
  const coursesSnapshot = await admin.firestore().collection(Curso.collection)
    .where('enterpriseRef', '==', enterpriseRef)
    .get();

  const nullCoursesSnapshot = await admin.firestore().collection(Curso.collection)
    .where('enterpriseRef', '==', null)
    .get();

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
      const coursesByStudentSnapshot = await admin.firestore().collection(CourseByStudent.collection)
        .where('userRef', 'in', chunk)
        .where('isExtraCourse', '==', false)
        .where('active', '==', true)
        .get();
      allCoursesByStudent = allCoursesByStudent.concat(coursesByStudentSnapshot.docs.map(doc => doc.data()));
    }

    users.forEach(user => {
      let cursosPlan = allCoursesByStudent.filter(x=>x.userRef.id == user.uid)
      cursosPlan?.forEach(course => {
        const courseJson = courses.find(item => item.id === course.courseRef.id);
        if (courseJson) {
          course.courseTime = courseJson.duracion
        }
      });
      let ritmo = getPerformanceWithDetails(cursosPlan)
      user['ritmo'] = ritmo
    });
    console.log(users)
    const rythms = {
      high: 0,
      medium: 0,
      low: 0,
      noPlan: 0,
      noIniciado:0
    };
    for (const user of users) {
      switch (user.ritmo) {
        case "no plan":
          rythms.noPlan += 1;
          break;
        case "high":
          rythms.high += 1;
          break;
        case "medium":
          rythms.medium += 1;
          break;
        case "low":
          rythms.low += 1;
          break;
        case "no iniciado":
          rythms.noIniciado += 1;
          break;
      }
    }
    console.log(rythms)

    batch.update(enterpriseRef, {
      rythms: rythms,
      rythmsDate: new Date()
    });

  
  }
  catch (error: any) {
    console.log(error);
    throw new Error(error.message);
  }



}



async function updateDataEnterpriseUsageLocal(enterpriseId: string, batch: FirebaseFirestore.WriteBatch) {
  try {
    const enterpriseRef = admin.firestore().collection(Enterprise.collection).doc(enterpriseId);
    
    // Verificar si la referencia de la empresa existe
    const enterpriseDoc = await enterpriseRef.get();
    if (!enterpriseDoc.exists) {
      console.log(`Enterprise with ID ${enterpriseId} does not exist.`);
      return;
    }

    console.log(`Editing enterprise ID ${enterpriseId}.`);


    const usersSnapshot = await admin.firestore().collection(User.collection)
      .where('enterprise', '==', enterpriseRef)
      .where('status', '==', 'active') // Filtrar usuarios con status active
      .get();
    
    const users: FirebaseFirestore.DocumentData[] = usersSnapshot.docs.map(doc => doc.data());
    let allClasses: FirebaseFirestore.DocumentData[] = [];
    const daysOfWeekWithHours: { day: number, data: { hour: number, classesTerminadas: number }[] }[] = [];

    // Inicializar el arreglo con los días de la semana y las horas del día
    for (let day = 0; day < 7; day++) {
      const hoursData = [];
      for (let hour = 0; hour < 24; hour++) {
        hoursData.push({ hour, classesTerminadas: 0 });
      }
      daysOfWeekWithHours.push({ day, data: hoursData });
    }

    for (const user of users) {
      const classesSnapshot = await admin.firestore().collection('classesByStudent')
        .where('userRef', '==', admin.firestore().collection('user').doc(user.uid))
        .where('completed', '==', true)
        .get();

      const classes: FirebaseFirestore.DocumentData[] = classesSnapshot.docs.map(doc => doc.data());
      allClasses = allClasses.concat(classes);
    }

    allClasses.forEach(classData => {
      const dateEnd = classData.dateEnd.toDate();
      const dayOfWeek = dateEnd.getUTCDay();
      const hour = dateEnd.getUTCHours();
      
      const dayData = daysOfWeekWithHours.find(dayData => dayData.day === dayOfWeek);
      if (dayData) {
        const hourData = dayData.data.find(hourData => hourData.hour === hour);
        if (hourData) {
          hourData.classesTerminadas += 1;
        }
      }
    });

    batch.update(enterpriseRef, {
      usage: daysOfWeekWithHours,
      usageDate: new Date()
    });

  } catch (error: any) {
    console.log(error);
    throw new Error(error.message);
  }
}

async function updateDataEnterpriseProgressPlanLocal(enterpriseId: string,batch?: FirebaseFirestore.WriteBatch) {

  try{
    const enterpriseRef = admin.firestore().collection(Enterprise.collection).doc(enterpriseId);
    // Verificar si la referencia de la empresa existe
    const enterpriseDoc = await enterpriseRef.get();
    if (!enterpriseDoc.exists) {
      console.log(`Enterprise with ID ${enterpriseId} does not exist.`);
      return;
    }
    console.log(`Editing enterprise ID ${enterpriseId}.`);
    const usersSnapshot = await admin.firestore().collection(User.collection)
    .where('enterprise', '==', enterpriseRef)
    .where('status', '==', 'active') // Filtrar usuarios con status active
    .get();
  
    const userRefs = usersSnapshot.docs.map(doc => doc.ref);
  
    // Buscar cursos que coincidan con la empresa o que tengan enterpriseRef null
    const coursesSnapshot = await admin.firestore().collection(Curso.collection)
      .where('enterpriseRef', '==', enterpriseRef)
      .get();
  
    const nullCoursesSnapshot = await admin.firestore().collection(Curso.collection)
      .where('enterpriseRef', '==', null)
      .get();
  
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
        const coursesByStudentSnapshot = await admin.firestore().collection(CourseByStudent.collection)
          .where('userRef', 'in', chunk)
          .where('isExtraCourse', '==', false)
          .where('active', '==', true)
          .get();
        allCoursesByStudent = allCoursesByStudent.concat(coursesByStudentSnapshot.docs.map(doc => doc.data()));
      }

  
      allCoursesByStudent?.forEach(course => {
        const courseJson = courses.find(item => item.id === course.courseRef.id);
        if (courseJson) {
          course.courseTime = courseJson.duracion
        }
      });


      const today = new Date().getTime();
    
      let targetComparisonDate = today;
      
      let lastDayPast = obtenerUltimoDiaDelMesAnterior(targetComparisonDate)
      let lastDayCurrent = obtenerUltimoDiaDelMes(targetComparisonDate)
      
      let progressMonth = getMonthProgress()
      
      
      let userStudyPlanUntilLastMonth = allCoursesByStudent.filter(x=>x.dateEndPlan  && (x.dateEndPlan?.seconds*1000)<=lastDayPast)
      let userStudyPlanCurrent = allCoursesByStudent.filter(x=>x.dateEndPlan  && (x.dateEndPlan?.seconds*1000)>lastDayPast && (x.dateEndPlan?.seconds*1000)<=lastDayCurrent )
      
      console.log('userStudyPlanUntilLastMonth',userStudyPlanUntilLastMonth,'userStudyPlanCurrent',userStudyPlanCurrent,lastDayPast,lastDayCurrent)


      let studentHours = 0
      let studentExpectedHours = 0
      let studentExpectedHoursTotal = 0


      allCoursesByStudent.forEach(course => {
        studentHours +=course.progressTime?course.progressTime:0
        studentExpectedHoursTotal +=course.courseTime
      });

      
      userStudyPlanUntilLastMonth.forEach(course => {
        studentExpectedHours +=course.courseTime
      });
      
      userStudyPlanCurrent.forEach(course => {
        studentExpectedHours +=(course.courseTime * progressMonth)
      });


      const respuesta = {
        studentHours,
        studentExpectedHours,
        studentExpectedHoursTotal,
      }
      console.log('respuesta',respuesta)
      batch.update(enterpriseRef, {
        progress: respuesta,
        progressDate: new Date()
      });

  }
  
  catch (error: any) {
    console.log(error);
    throw new Error(error.message);
  }

  
}

async function updateDataAllEnterprisesProgressPlanLocal() {
  const batch = admin.firestore().batch();
  
  try {
    const licensesSnapshot = await admin.firestore().collection(License.collection).where('status', '==', 'active').get();
    const enterpriseRefs = new Set<FirebaseFirestore.DocumentReference>();
    const enterpriseIds = new Set<string>();


    licensesSnapshot?.forEach(doc => {
      const licenseData = doc.data();
      if (licenseData?.enterpriseRef) {
        enterpriseRefs.add(licenseData.enterpriseRef);
        enterpriseIds.add(licenseData.enterpriseRef.id);
      }
    });

    const uniqueEnterpriseRefs = Array.from(enterpriseRefs);
    const uniqueEnterpriseIds = Array.from(enterpriseIds);

    for (const enterpriseId of uniqueEnterpriseIds) {
      await updateDataEnterpriseProgressPlanLocal(enterpriseId, batch);
    }

    await batch.commit();
    console.log('Actualización completada para todas las empresas.');

  } catch (error: any) {
    console.log(error);
    throw new Error(error.message);
  }
}
  


  
  
  