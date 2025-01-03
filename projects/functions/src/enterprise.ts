import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Clase, ClassByStudent, CourseByStudent, Curso, Enterprise, License, StudyPlanClass, User,firestoreTimestampToNumberTimestamp,getMonthProgress,getPerformanceWithDetails, obtenerUltimoDiaDelMes, obtenerUltimoDiaDelMesAnterior } from 'shared';

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

// For enterprise-list.component
export const updateAllDataEnterpriseProgressPlanSchedule = functions.pubsub.schedule('every monday 06:00').onRun(async (context) => {
  try {
    await updateDataAllEnterprisesProgressPlanLocal();
    console.log('Updated all enterprises usage');
  } catch (error) {
    console.error('Error updating all enterprises usage:', error);
  }
});

// For users-usage.component
export const updateDataAllEnterprisesUsageSchedule = functions.pubsub.schedule('every monday 06:00').onRun(async (context) => {
  try {
    await updateDataAllEnterprisesUsageLocal();
    console.log('Updated all enterprises usage');
  } catch (error) {
    console.error('Error updating all enterprises usage:', error);
  }
});

// For enterprise-list
export const updateDataAllEnterprisesRhythmSchedule = functions.pubsub.schedule('every monday 06:00').onRun(async (context) => {
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
    const enterpriseData = enterpriseDoc.data();

    const previousUsage: { 
      day: number, 
      data: { 
        hour: number, 
        classesTerminadas: number 
      }[] 
    }[] = enterpriseData.usage ? enterpriseData.usage : null;
    const previousUsageDate = enterpriseData.usageDate ? enterpriseData.usageDate?.toDate() : null;
    const devicesUsage = { movil: 0, desktop: 0 };

    // Inicializar el arreglo con los días de la semana y las horas del día
    const daysOfWeekWithHours: { day: number, data: { hour: number, classesTerminadas: number }[] }[] = [];
    for (let day = 0; day < 7; day++) {
      const hoursData = [];
      for (let hour = 0; hour < 24; hour++) {
        hoursData.push({ hour, classesTerminadas: 0 });
      }
      daysOfWeekWithHours.push({ day, data: hoursData });
    }

    const usersSnapshot = await admin.firestore().collection(User.collection)
      .where('enterprise', '==', enterpriseRef)
      .where('status', '==', 'active') // Filtrar usuarios con status active
      .get();
    const users: FirebaseFirestore.DocumentData[] = usersSnapshot.docs.map(doc => doc.data());

    let classesCompleted: FirebaseFirestore.DocumentData[] = [];
    for (const user of users) {
      if (previousUsageDate) {
        const lastClassesSnapshot = await admin.firestore().collection('classesByStudent')
          .where('userRef', '==', admin.firestore().collection('user').doc(user.uid))
          .where('completed', '==', true)
          .where('dateEnd', '>', previousUsageDate)
          .get();
  
        const classes: FirebaseFirestore.DocumentData[] = lastClassesSnapshot.docs.map(doc => doc.data());
        classesCompleted = classesCompleted.concat(classes);
      }
      else {
        const allClassesSnapshot = await admin.firestore().collection('classesByStudent')
          .where('userRef', '==', admin.firestore().collection('user').doc(user.uid))
          .where('completed', '==', true)
          .get();
  
        const classes: FirebaseFirestore.DocumentData[] = allClassesSnapshot.docs.map(doc => doc.data());
        classesCompleted = classesCompleted.concat(classes);
      }
    }
    console.log("current clases quantity: ", classesCompleted.length)
    classesCompleted.forEach(classData => {
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

      // Procesar el conteo por dispositivo
      const device = classData.device;
      if (device && devicesUsage[device] !== undefined) {
        devicesUsage[device] += 1;
      }
    });

    // Merge de datos si ya existen datos previos
    if (previousUsage) {
      for (let day = 0; day < 7; day++) {
        const foundDayData = previousUsage.find(dayData => dayData.day === day);
        const existingDayData = foundDayData === undefined ? [] : foundDayData.data
        const newDayData = daysOfWeekWithHours[day].data;

        newDayData.forEach((hourData, hour) => {
          const existingHourData = existingDayData.find((h: any) => h.hour === hour);
          if (existingHourData) {
            hourData.classesTerminadas += existingHourData.classesTerminadas;
          }
        });
      }

      // Merge de uso de dispositivos
      devicesUsage.movil += enterpriseData.devices?.movil ? enterpriseData.devices?.movil : 0;
      devicesUsage.desktop += enterpriseData.devices?.desktop ? enterpriseData.devices?.desktop : 0;
    }

    batch.update(enterpriseRef, {
      usage: daysOfWeekWithHours,
      usageDate: new Date(),
      devices: devicesUsage  // Guardar el uso de dispositivo
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

// async function updateDataEnterpriseProgressPlanLocal(enterpriseId: string,batch?: FirebaseFirestore.WriteBatch) {

//   try {
//     const enterpriseRef = admin.firestore().collection(Enterprise.collection).doc(enterpriseId);
//     // Verificar si la referencia de la empresa existe
//     const enterpriseDoc = await enterpriseRef.get();
//     if (!enterpriseDoc.exists) {
//       console.log(`Enterprise with ID ${enterpriseId} does not exist.`);
//       return;
//     }
//     console.log(`Editing enterprise ID ${enterpriseId}.`);
//     const enterpriseData = enterpriseDoc.data();

//     const usersSnapshot = await admin.firestore().collection(User.collection)
//     .where('enterprise', '==', enterpriseRef)
//     .where('status', '==', 'active') // Filtrar usuarios con status active
//     .get();
  
//     const userRefs = usersSnapshot.docs.map(doc => doc.ref);
  
//     // Buscar cursos que coincidan con la empresa o que tengan enterpriseRef null
//     const coursesSnapshot = await admin.firestore().collection(Curso.collection)
//       .where('enterpriseRef', '==', enterpriseRef)
//       .get();
  
//     const nullCoursesSnapshot = await admin.firestore().collection(Curso.collection)
//       .where('enterpriseRef', '==', null)
//       .get();
  
//     // Unir los cursos con enterpriseRef igual al enterpriseRef de la empresa y los que tienen enterpriseRef null
//     const courses = coursesSnapshot.docs.map(doc => doc.data()).concat(nullCoursesSnapshot.docs.map(doc => doc.data()));
  
//     // Dividir userRefs en grupos de 10
//     const chunks = [];
//     for (let i = 0; i < userRefs.length; i += 10) {
//       chunks.push(userRefs.slice(i, i + 10));
//     }

//     const previousProgress = enterpriseData?.progress;
//     const previousProgressDate = new Date(firestoreTimestampToNumberTimestamp(enterpriseData?.progressDate))
//     // Obtener coursesByStudent para los usuarios en chunks
//     let allCoursesByStudent = [];
//     // Solo coursesByStudent despues de la fecha registrada de progreso
//     if (previousProgressDate) {
//       for (const chunk of chunks) {
//         const coursesByStudentSnapshot = await admin.firestore().collection(CourseByStudent.collection)
//           .where('userRef', 'in', chunk)
//           .where('isExtraCourse', '==', false)
//           .where('active', '==', true)
//           .where('dateEndPlan', '>', previousProgressDate)
//           .get();
//         allCoursesByStudent = allCoursesByStudent.concat(coursesByStudentSnapshot.docs.map(doc => doc.data()));
//       }
//     }
//     // Todos los coursesByStudent
//     else {
//       for (const chunk of chunks) {
//         const coursesByStudentSnapshot = await admin.firestore().collection(CourseByStudent.collection)
//           .where('userRef', 'in', chunk)
//           .where('isExtraCourse', '==', false)
//           .where('active', '==', true)
//           .get();
//         allCoursesByStudent = allCoursesByStudent.concat(coursesByStudentSnapshot.docs.map(doc => doc.data()));
//       }
//     }

//     allCoursesByStudent?.forEach(course => {
//       const courseJson = courses.find(item => item.id === course.courseRef.id);
//       if (courseJson) {
//         course.courseTime = courseJson.duracion
//       }
//     });

//     const today = new Date().getTime();
//     let lastDayPast = obtenerUltimoDiaDelMesAnterior(today)
//     let lastDayCurrent = obtenerUltimoDiaDelMes(today)
//     let progressMonth = getMonthProgress()

//     let studentHours = 0
//     let studentExpectedHours = 0
//     let studentExpectedHoursTotal = 0
    
//     let userStudyPlanUntilLastMonth = allCoursesByStudent.filter(x=>x.dateEndPlan  && (x.dateEndPlan?.seconds*1000)<=lastDayPast)
//     let userStudyPlanCurrent = allCoursesByStudent.filter(x=>x.dateEndPlan  && (x.dateEndPlan?.seconds*1000)>lastDayPast && (x.dateEndPlan?.seconds*1000)<=lastDayCurrent )
    
//     console.log('userStudyPlanUntilLastMonth',userStudyPlanUntilLastMonth,'userStudyPlanCurrent',userStudyPlanCurrent,lastDayPast,lastDayCurrent)

//     if (previousProgressDate) {
//       studentHours = previousProgress?.studentHours
//       studentExpectedHours = previousProgress?.studentExpectedHours
//       studentExpectedHoursTotal = previousProgress?.studentExpectedHoursTotal

//       allCoursesByStudent.forEach(course => {
//         studentHours += course.progressTime ? course.progressTime : 0
//         studentExpectedHoursTotal += course.courseTime;
//         if (firestoreTimestampToNumberTimestamp(course.dateEndPlan) <= lastDayCurrent) {
//           studentExpectedHours += course.courseTime * progressMonth;
//         }
//       });

//     } else {
//       allCoursesByStudent.forEach(course => {
//         studentHours +=course.progressTime?course.progressTime:0
//         studentExpectedHoursTotal += course.courseTime
//       });

//       userStudyPlanUntilLastMonth.forEach(course => {
//         studentExpectedHours +=course.courseTime
//       });
      
//       userStudyPlanCurrent.forEach(course => {
//         studentExpectedHours +=(course.courseTime * progressMonth)
//       });
//     }

//     const respuesta = {
//       studentHours,
//       studentExpectedHours,
//       studentExpectedHoursTotal,
//     }
//     console.log('respuesta',respuesta)
//     batch.update(enterpriseRef, {
//       progress: respuesta,
//       progressDate: new Date()
//     });

//   }
  
//   catch (error: any) {
//     console.log(error);
//     throw new Error(error.message);
//   }
  
// }

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
  

export const updateAllDataEnterpriseMonthlyClasses = functions.pubsub.schedule('every monday 06:00').onRun(async (context) => {
  try {
    await updateDataAllEnterprisesMonthlyClassesLocal();
    console.log('Updated all enterprises monthly classes');
  } catch (error) {
    console.error('Error updating all enterprises usage:', error);
  }
})

async function updateDataAllEnterprisesMonthlyClassesLocal() {
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
    const uniqueEnterpriseIds = Array.from(enterpriseIds);
    
    const coursesSnapshot = await admin.firestore().collection(Curso.collection).get();
    const courses: FirebaseFirestore.DocumentData[] = coursesSnapshot.docs.map(doc => doc.data());

    // Obtenemos todas las clases
    // const classesSnapshot = await admin.firestore().collection(Clase.collection).get();
    // const classesOld: FirebaseFirestore.DocumentData[] = classesSnapshot.docs.map(doc => doc.data());
    const classes = courses.flatMap(course =>
      course.modulos.flatMap(modulo => modulo.clases)
    );

    for (const enterpriseId of uniqueEnterpriseIds) {
      await updateDataEnterpriseMonthlyClassesLocal(enterpriseId, classes, batch);
    }

    await batch.commit();
    console.log('Actualización de datos de clases por meses completada para todas las empresas.');

  } catch (error: any) {
    console.log(error);
    throw new Error(error.message);
  }
}
  
async function updateDataEnterpriseMonthlyClassesLocal(enterpriseId: string, classes: FirebaseFirestore.DocumentData[], batch?: FirebaseFirestore.WriteBatch) {

  try{
    const enterpriseRef = admin.firestore().collection(Enterprise.collection).doc(enterpriseId);
      
    // Verificar si la referencia de la empresa existe
    const enterpriseDoc = await enterpriseRef.get();
    if (!enterpriseDoc.exists) {
      console.log(`Enterprise with ID ${enterpriseId} does not exist.`);
      return;
    }
    console.log(`Editing enterprise ID ${enterpriseId}.`);
    const enterpriseData = enterpriseDoc.data();

    const usersSnapshot = await admin.firestore().collection(User.collection)
    .where('enterprise', '==', enterpriseRef)
    .where('status', '==', 'active') // Filtrar usuarios con status active
    .get();
    const users = usersSnapshot.docs.map(doc => doc.data());

    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1) // Start of the current month
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999) // End of the current month
    // console.log("startOfMonth", startOfMonth)
    // console.log("endendOfMonth",endOfMonth)

    // Saving data in a property for now
    const monthlyClassesData: {value: number, labe: string}[] = enterpriseData.monthlyClassesData
    let allUsersClassesByStudent = []
    for (const user of users) {
      if (monthlyClassesData) {
          const allClassesSnapshot = await admin.firestore().collection('classesByStudent')
          .where('userRef', '==', admin.firestore().collection('user').doc(user.uid))
          .where('completed', '==', true)
          .where('dateEnd', '>', startOfMonth)
          .where('dateEnd', '<=', endOfMonth)
          .get();
          const classes: FirebaseFirestore.DocumentData[] = allClassesSnapshot.docs.map(doc => doc.data());
          allUsersClassesByStudent = allUsersClassesByStudent.concat(classes);
      } 
      else {
        const allClassesSnapshot = await admin.firestore().collection('classesByStudent')
        .where('userRef', '==', admin.firestore().collection('user').doc(user.uid))
        .where('completed', '==', true)
        .get();
        const classes: FirebaseFirestore.DocumentData[] = allClassesSnapshot.docs.map(doc => doc.data());
        allUsersClassesByStudent = allUsersClassesByStudent.concat(classes);
      }
    }

    // console.log("allUsersClassesByStudent.length", allUsersClassesByStudent.length);
    // console.log("allUsersClassesByStudent[0]", allUsersClassesByStudent[0])
  
    const logs = allUsersClassesByStudent.map(classByStudent => {
      const clase = classes.find(x => x.id === classByStudent.classRef.id)
      return {
        classDuration: clase ? clase.duracion as number : 0,
        endDate: firestoreTimestampToNumberTimestamp(classByStudent.dateEnd)
      };
    })
    // console.log("logs.length", logs.length)
    // console.log("logs[0]", logs[0])

    let dataToSave = []
    if (monthlyClassesData) {

      dataToSave = [...monthlyClassesData]
    
      const monthLabel = now.toLocaleString('es-ES', { month: 'short' }).replace(/\.$/, '');
      const label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1); // Capitalize the first letter
  
      // Step 2: Calculate value for the current month
      const value = logs.reduce((total, log) => {
        const logDate = new Date(log.endDate);
        if ( logDate.getUTCMonth() === currentMonth && logDate.getUTCFullYear() === currentYear ) {
          return total + log.classDuration / 60; // Convert minutes to hours
        }
        return total;
      }, 0);
  
      // Replace or add the current month's data
      const existingMonthIndex = dataToSave.findIndex(item => item.label === label);
      if (existingMonthIndex > -1) {
        // Update existing month's value
        dataToSave[existingMonthIndex].value = value;
      } else {
        // Add new entry for the current month if it doesn't exist
        dataToSave.unshift({ value, label });
      }

      console.log("dataToSave after updating current month: ");

    }
    else {    
      // Generate data for the last 12 months if no existing data
      for (let i = 0; i < 12; i++) {
        const month = getPreviousMonthDate(now, i);
        const monthLabel = now.toLocaleString('es-ES', { month: 'short' }).replace(/\.$/, '');
        const label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1); // Capitalize the first letter
    
        // Calculate values for all months
        const value = logs.reduce((total, log) => {
          const logDate = new Date(log.endDate);
          if ( logDate.getUTCMonth() === month.getUTCMonth() && logDate.getUTCFullYear() === month.getUTCFullYear() ) {
            return total + log.classDuration / 60; // Convert minutes to hours
          }
          return total;
        }, 0);
    
        dataToSave.unshift({ value, label });
        
      }
      console.log("dataToSave after generating last 12 months: ");
      
    }
    // Define the order of months
    const monthOrder = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sept", "Oct", "Nov", "Dic"
    ];

    // Sort data based on month order
    dataToSave.sort((a, b) => monthOrder.indexOf(a.label) - monthOrder.indexOf(b.label));

    console.log(dataToSave)

    batch.update(enterpriseRef, {
      monthlyClassesData: dataToSave, 
    });  
  }
  catch (error: any) {
    console.log(error);
    throw new Error(error.message);
  }

  
}

function getPreviousMonthDate(date, monthsToSubtract) {
  const newDate = new Date(date);
  newDate.setDate(1); // Establecer el día al 1 para evitar desbordamientos de mes
  newDate.setMonth(newDate.getMonth() - monthsToSubtract);

  // Ajustar al último día del mes si es necesario
  const lastDayOfPreviousMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
  if (newDate.getDate() > lastDayOfPreviousMonth) {
      newDate.setDate(lastDayOfPreviousMonth);
  }

  return newDate;
}