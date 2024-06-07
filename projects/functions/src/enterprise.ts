import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ClassByStudent, Enterprise, StudyPlanClass, User } from 'shared';

const db = admin.firestore();

// export const onProfileAdded = functions.firestore.document('profile/{doc}').onCreate(async (snap, _) => {
//     const profile = snap.data();
    
//     if (!profile.enterpriseRef || !(profile.enterpriseRef instanceof admin.firestore.DocumentReference)) {
//         console.log("El perfil no tiene enterpriseRef como DocumentReference");
//         return;
//     }

//     const enterpriseRef = profile.enterpriseRef;
//     const enterprise = (await enterpriseRef.get()).data();

//     if (!enterprise || !enterprise.id) {
//         console.error('Enterprise data not found');
//         return;
//     }

//     return db.collection(Enterprise.collection).doc(enterprise.id).update(
//         {
//             profilesNo: admin.firestore.FieldValue.increment(1)
//         }
//     ).then(() => {
//         console.log(`Updated enterprise: ${enterprise.name} profiles quantity to: ${enterprise.profilesNo + 1}`);
//     }).catch((error) => {
//         console.error(error);
//     });
// });



export const updateDataEnterpriseUsage = functions.https.onCall(async (data, _) => {
    try {
      const enterpriseId = data.enterpriseId;
  
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

  
      allClasses.forEach(classData => {
        const dateEnd = classData.dateEnd.toDate();
        const dayOfWeek = dateEnd.getUTCDay();
        const hour = dateEnd.getUTCHours();
        
        const dayData = daysOfWeekWithHours.find(dayData => dayData.day === dayOfWeek);
        console.log('dayData',dayData)
        if (dayData) {
          const hourData = dayData.data.find(hourData => hourData.hour === hour);
          if (hourData) {
            hourData.classesTerminadas += 1;
          }
        }
      });
  
      return db.collection(Enterprise.collection).doc(enterpriseId).update({
        usage: daysOfWeekWithHours,
        usageDate: new Date()
      }).then(() => {
        console.log(`Updated enterprise ${enterpriseId} with usage`);
      }).catch((error) => {
        console.error(error);
      });
  
    } catch (error: any) {
      console.log(error);
      throw new functions.https.HttpsError("unknown", error.message);
    }
});
  
  
  
  
  
  