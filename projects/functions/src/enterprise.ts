import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ClassByStudent, Enterprise, License, StudyPlanClass, User } from 'shared';

const db = admin.firestore();


export const updateDataAllEnterprisesUsageSchedule = functions.pubsub.schedule('every monday 06:00').onRun(async (context) => {
  try {
    await updateDataAllEnterprisesUsageLocal();
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


async function updateDataAllEnterprisesUsageLocal() {
  const batch = admin.firestore().batch();
  
  try {
    const licensesSnapshot = await admin.firestore().collection(License.collection).where('status', '==', 'active').get();
    const enterpriseRefs = new Set<FirebaseFirestore.DocumentReference>();

    licensesSnapshot?.forEach(doc => {
      const licenseData = doc.data();
      if (licenseData?.enterpriseRef) {
        enterpriseRefs.add(licenseData.enterpriseRef);
      }
    });

    const uniqueEnterpriseRefs = Array.from(enterpriseRefs);

    for (const enterpriseRef of uniqueEnterpriseRefs) {
      await updateDataEnterpriseUsageLocal(enterpriseRef.id, batch);
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

export const updateDataEnterpriseUsage = functions.https.onCall(async (data, _) => {
    try {
      const batch = admin.firestore().batch();
      const enterpriseId = data.enterpriseId;
      await updateDataEnterpriseUsageLocal(enterpriseId,batch)
      await batch.commit();
      console.log(`Actualización empresas ${enterpriseId}`)
    } catch (error: any) {
      console.log(error);
      throw new functions.https.HttpsError("unknown", error.message);
    }
});
  
  
  
  
  
  