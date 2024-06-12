import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Enterprise, User, getMonthProgress, obtenerUltimoDiaDelMes, obtenerUltimoDiaDelMesAnterior,CourseByStudent,Curso, titleCase } from 'shared';
import { _sendMailHTML } from './email';

const db = admin.firestore();

export const mailAccountManagementAdmin = functions.https.onCall(async (data, _) => {
  try {
    let idEmpresa = data.idEmpresa;
    await generateReportEnterpriseAdminLocal(idEmpresa)
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

async function generateReportEnterpriseAdminLocal(idEmpresa: string) {
  try{

    const style = `
    <style>
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
      }
      th {
        background-color: #f2f2f2;
      }
      .high {
        color: green;
      }
      .medium {
        color: orange;
      }
      .low {
        color: red;
      }
      .no-iniciado, .no-plan {
        color: gray;
      }
    </style>`;

    const users = await generateReportEnterpriseAdmin(idEmpresa);
    const enterpriseDoc = await admin.firestore().collection(Enterprise.collection).doc(idEmpresa).get();
    const enterpriseData = enterpriseDoc.data();
    let accountManagerNumber = enterpriseData.accountManagerNumber ? enterpriseData.accountManagerNumber : '524271797182'
    let htmlMail = `<p>Encuentra a continuación el resumen de tu equipo de usuarios activos en PREDYC.</p>
    <p><strong>Usuario activos:</strong><p>`
    htmlMail+= users.table
    if(accountManagerNumber){
      htmlMail+= `<br><p>Habla con tu account manager${enterpriseData?.accountManagerName? ' ' + titleCase(enterpriseData?.accountManagerName): '' } vía WhatsApp: <a href="https://wa.me/${accountManagerNumber}">${accountManagerNumber}</a></p>`;
    }
    htmlMail+= `<p>Inicia sesión en PREDYC : <a href="https://predyc.com">https://predyc.com</a></p>`;
    let adminUsers = users.users.filter(x=>x.role == 'admin')
    for (let i = 0; i < adminUsers.length; i++) {
      const user = adminUsers[i];
      let htmlMailFinal = ` <!DOCTYPE html><html><head>${style}</head><body><p><strong>${titleCase(user.displayName)}</strong>,</p>${htmlMail}</body></html>`;
      console.log('htmlMailFinal',htmlMailFinal)
      const sender = "desarrollo@predyc.com";
      const recipients = [user.email];
      const subject = `Reporte de progresos en PREDYC de tu empresa ${enterpriseData.name.toUpperCase()}`;
      const htmlContent = htmlMailFinal;
      const cc = ["desarrollo@predyc.com"];
      const mailObj = { sender, recipients, subject, cc, htmlContent };
      await _sendMailHTML(mailObj);
    }
  }
  catch(error: any) {
    console.log(error);
    throw error.message;
  }

}


async function generateReportEnterpriseAdmin(idEmpresa: string) {
  try {
    // Obtener referencia de la empresa
    const enterpriseRef = admin.firestore().collection(Enterprise.collection).doc(idEmpresa);

    // Buscar usuarios de la empresa con estado activo
    const usersSnapshot = await admin.firestore().collection(User.collection)
      .where('enterprise', '==', enterpriseRef)
      .where('status', '==', 'active')
      .get();

    // Mapear los usuarios encontrados
    const users = usersSnapshot.docs.map(doc => doc.data());
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
      user['ritmoText'] = getRitmoText(ritmo);
    });

    const sortedUsers = users.sort((a, b) => compareRitmo(a.ritmo, b.ritmo));
    const tablaUsuarios = generateUsersAdminTableHTML(sortedUsers)

    return {
      table:tablaUsuarios,
      users:sortedUsers,
      courses,
      allCoursesByStudent
    };
  } catch (error) {
    console.error('Error al obtener usuarios o cursos de la empresa:', error);
    throw error;
  }
}

function generateUsersAdminTableHTML(sortedUsers: any[]): string {


  const header = `
    <table>
      <thead>
        <tr>
          <th>Persona</th>
          <th>Ritmo</th>
        </tr>
      </thead>
      <tbody>
  `;

  const rows = sortedUsers.map(user => `
    <tr>
      <td>${titleCase(user.displayName)}</td>
      <td class="${user.ritmo.replace(' ', '-')}">${user.ritmoText}</td>
    </tr>
  `).join('');

  const footer = `
      </tbody>
    </table>
  `;

  return header + rows + footer;
}

function getPerformanceWithDetails(userStudyPlan:any): "no plan" | "high" | "medium" | "low" | "no iniciado" {
  

  const today = new Date().getTime();

  let targetComparisonDate = today;

  let lastDayPast = obtenerUltimoDiaDelMesAnterior(targetComparisonDate)
  let lastDayCurrent = obtenerUltimoDiaDelMes(targetComparisonDate)

  let progressMonth = getMonthProgress()



  let userStudyPlanUntilLastMonth = userStudyPlan.filter(x=>x.dateEndPlan  && (x.dateEndPlan?.seconds*1000)<=lastDayPast)
  let userStudyPlanCurrent = userStudyPlan.filter(x=>x.dateEndPlan  && (x.dateEndPlan?.seconds*1000)>lastDayPast && (x.dateEndPlan?.seconds*1000)<=lastDayCurrent )

  let studentHours = 0
  let studentExpectedHours = 0

  userStudyPlanUntilLastMonth.forEach(course => {
    if(course.progress >=100){
      studentExpectedHours +=course.courseTime
      studentHours +=course.courseTime
    }
    else{
      studentExpectedHours +=course.courseTime
      studentHours +=course.progressTime
    }
  });

  userStudyPlanCurrent.forEach(course => {
    
    studentExpectedHours +=(course.courseTime * progressMonth)
    studentHours +=course.progressTime?course.progressTime:0
  });


  let procentaje = studentHours*100/studentExpectedHours


  let performance: "no plan" | "high" | "medium" | "low" | "no iniciado";


  let validator = userStudyPlan.find((x) => x.progressTime > 0);
  if (!validator && userStudyPlan.length > 0) {
    performance = "no iniciado";
  } else if (userStudyPlan.length == 0) {
    performance = "no plan";
  } else if (procentaje >=80) {
    performance = "high";
  } else if (procentaje >=50) {
    performance = "medium";
  } else {
    performance = "low";
  }

  return performance;
}

function getRitmoText(ritmo: string): string {
  switch (ritmo) {
    case 'high':
      return 'Ritmo óptimo';
    case 'medium':
      return 'Ritmo medio';
    case 'low':
      return 'Ritmo bajo';
    case 'no iniciado':
      return 'No iniciado';
    case 'no plan':
      return 'Sin plan de estudios';
    default:
      return '';
  }
}

function compareRitmo(a: string, b: string): number {
  const order = ['high', 'medium', 'low', 'no iniciado', 'no plan'];
  return order.indexOf(a) - order.indexOf(b);
}







  