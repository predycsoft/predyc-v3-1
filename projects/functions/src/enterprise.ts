import * as functionsV2 from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { ClassByStudent, Enterprise, License, StudyPlanClass, User } from 'shared';

const db = admin.firestore();


// export const updateDataAllEnterprisesUsageSchedule = functions.pubsub.schedule('every monday 06:00').onRun(async (context) => {
//   try {
//     await updateDataAllEnterprisesUsageLocal();
//     console.log('Updated all enterprises usage');
//   } catch (error) {
//     console.error('Error updating all enterprises usage:', error);
//   }
// });

// export const updateDataEnterpriseUsage = functions.https.onCall(async (data, _) => {
//   try {
//     const batch = admin.firestore().batch();
//     const enterpriseId = data.enterpriseId;
//     await updateDataEnterpriseUsageLocal(enterpriseId,batch)
//     await batch.commit();
//     console.log(`Actualización empresas ${enterpriseId}`)
//   } catch (error: any) {
//     console.log(error);
//     throw new functions.https.HttpsError("unknown", error.message);
//   }
// });

export const updateDataEnterpriseUsage = functionsV2.https.onCall({
  timeoutSeconds: 3600 // Establece el tiempo de espera a 3600 segundos (1 hora)
}, async (request: functionsV2.https.CallableRequest) => {
  try {
    const data = request.data;
    const batch = admin.firestore().batch();
    const enterpriseId = data.enterpriseId;
    await updateDataEnterpriseUsageLocal(enterpriseId, batch);
    await batch.commit();
    console.log(`Actualización empresas ${enterpriseId}`);
  } catch (error) {
    console.error(error);
    throw new functionsV2.https.HttpsError('unknown', (error as Error).message);
  }
});

export const updateDataAllEnterprisesUsageSchedule = functionsV2.scheduler.onSchedule({
  schedule: '0 6 * * MON',
  timeoutSeconds: 3600 // Establece el tiempo de espera a 3600 segundos (1 hora)
}, async (context) => {
  try {
    await updateDataAllEnterprisesUsageLocal();
    console.log('Updated all enterprises usage');
  } catch (error) {
    console.error('Error updating all enterprises usage:', error);
  }
});

export const updateDataAllEnterprisesUsage = functionsV2.https.onRequest({
  timeoutSeconds: 3600, // Establece el tiempo de espera a 3600 segundos (1 hora)
}, async (req, res) => {
  try {
    console.log('updateDataAllEnterprisesUsageStart');
    await updateDataAllEnterprisesUsageLocal();
    console.log('updateDataAllEnterprisesUsageEnd');
    res.status(200).send('Update completed successfully');
  } catch (error: any) {
    console.log(error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

async function updateDataAllEnterprisesUsageLocal() {
  const batch = admin.firestore().batch();
  
  try {
    const licensesSnapshot = await admin.firestore().collection(License.collection).where('status', '==', 'active').get();
    const enterpriseRefsIds = new Set<string>();


    licensesSnapshot?.forEach(doc => {
      const licenseData = doc.data();
      if (licenseData?.enterpriseRef) {
        enterpriseRefsIds.add(licenseData.enterpriseRef.id);
      }
    });

    const uniqueEnterpriseRefsIds = Array.from(enterpriseRefsIds);

    console.log('uniqueEnterpriseRefs',uniqueEnterpriseRefsIds)

    for (const enterpriseId of uniqueEnterpriseRefsIds) {
      console.log(`Actualización incio empresa ${enterpriseId}`);
      await updateDataEnterpriseUsageLocal(enterpriseId, batch);
    }

    await batch.commit();
    console.log('Actualización completada para todas las empresas.');

  } catch (error: any) {
    console.log(error);
    throw new Error(error.message);
  }
}


async function updateDataEnterpriseUsageLocal(enterpriseId: string, batch: FirebaseFirestore.WriteBatch) {
  try {
    const enterpriseRef = admin.firestore().collection(Enterprise.collection).doc(enterpriseId);
    const usersSnapshot = await admin.firestore().collection(User.collection).where('enterprise', '==', enterpriseRef).get();
    
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

    allClasses?.forEach(classData => {
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

  
  
  
  
  
  