import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Enterprise, User, getMonthProgress, obtenerUltimoDiaDelMes, obtenerUltimoDiaDelMesAnterior,CourseByStudent,Curso, titleCase, firestoreTimestampToNumberTimestamp } from 'shared';
import { _sendMailHTML } from './email';

const db = admin.firestore();

const firma = `<p>Saludos cordiales,</p>
<img src="https://predictiva21.com/wp-content/uploads/2024/06/LOGOPREDYC-BACKWHITE.webp" alt="Predyc" style="width: 150px; height: auto;">`;
const styleMail = `
<style>
  table {
    max-width: 100%;
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
  .month-row {
    border: none;
    padding-top: 20px;
    font-weight: bold;
  }
  .month-name {
    padding-top: 20px;
    font-weight: bold;
    border: none;
    text-align: left;
  }
</style>`;

export const mailAccountManagementAdmin = functions.https.onCall(async (data, _) => {
  try {
    let idEmpresa = data.idEmpresa;
    await generateReportEnterpriseAdminLocal(idEmpresa)
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

export const mailAccountManagementUsers = functions.https.onCall(async (data, _) => {
  try {
    let idEmpresa = data.idEmpresa;
    await generateReportEnterpriseUsersLocal(idEmpresa)
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

async function generateReportEnterpriseAdminLocal(idEmpresa: string) {
  try{
    const style = styleMail
    const users = await generateReportEnterpriseAdmin(idEmpresa);
    const enterpriseDoc = await admin.firestore().collection(Enterprise.collection).doc(idEmpresa).get();
    const enterpriseData = enterpriseDoc.data();
    let accountManagerNumber = enterpriseData.accountManagerNumber ? enterpriseData.accountManagerNumber : '524271797182'
    let htmlMail = `<p>Encuentra a continuación el resumen de tu equipo de usuarios activos en PREDYC.</p>
    <p><strong>Usuario activos:</strong><p>`
    htmlMail+= users.table
    if(accountManagerNumber){
      htmlMail+= `<br><p>Habla con tu account manager${enterpriseData?.accountManagerName? ' ' + titleCase(enterpriseData?.accountManagerName): '' } vía Whatsapp: <a href="https://wa.me/${accountManagerNumber}">${accountManagerNumber}</a></p>`;
    }
    htmlMail+= `<p>Inicia sesión en PREDYC : <a href="https://predyc.com">https://predyc.com</a></p>`;
    let recipientMail = enterpriseData?.reportMails ? enterpriseData?.reportMails.split(','): ['arturo.romero@predyc.com']
    let htmlMailFinal = ` <!DOCTYPE html><html><head>${style}</head><body><p><strong>Estimado administrador ${enterpriseData.name.toUpperCase()}</strong>,</p>${htmlMail}<br>${firma}
    </body></html>`;
    console.log('htmlMailFinal',htmlMailFinal)
    const sender = "desarrollo@predyc.com";
    //const recipients = recipientMail;
    const recipients = ['andres.gonzalez@predyc.com'];
    const subject = `Reporte de progresos en PREDYC de tu empresa ${enterpriseData.name.toUpperCase()}`;
    const htmlContent = htmlMailFinal;
    const cc = ["desarrollo@predyc.com,arturo.romero@predyc.com"];
    const mailObj = { sender, recipients, subject, cc, htmlContent };
    console.log(mailObj)
    const now = new Date();
    enterpriseDoc.ref.update({
      lastDayAdminMail: now
    })
    _sendMailHTML(mailObj);
  }
  catch(error: any) {
    console.log(error);
    throw error.message;
  }

}

async function generateReportEnterpriseUsersLocal(idEmpresa: string) {
  try{
    const dataReport = await generateReportEnterpriseUsers(idEmpresa);

  }
  catch(error: any) {
    console.log(error);
    throw error.message;
  }


}

async function generateReportEnterpriseUsers(idEmpresa: string) {

  try{
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
          .where('active', '==', true)
          .get();
        allCoursesByStudent = allCoursesByStudent.concat(coursesByStudentSnapshot.docs.map(doc => doc.data()));
      }
      let respuesta = [];
      users.forEach(user => {
        let cursosPlan = allCoursesByStudent.filter(x=>x.userRef.id == user.uid)
        if(cursosPlan.length){
          let cursos = buildMonths(cursosPlan,courses)
          const datos = generateUsersProgressTableHTML(cursos)
          let html = `<p><strong>${titleCase(user.displayName)}</strong>,</p><p>A continuación, te presentamos el estatus de tu plan de estudios:</p><br>${datos}
          <br><p>Necesitas ayuda, habla con alguien de PREDYC vía Whatsapp: <a href="https://wa.me/524271797182">524271797182</a></p>`
          html+= `<p>Inicia sesión en PREDYC : <a href="https://predyc.com">https://predyc.com</a></p><br>`;
          let respuestaItem = {
            user:user,
            html:html,
          }
          respuesta.push(respuestaItem)
        }
      });
      if(respuesta.length>0){
        const now = new Date();
        enterpriseRef.update({
          lastDayUsersMail: now
        })
        // para pruebas 
        // respuesta = [respuesta[0]]
        respuesta.forEach(correo => {
          const htmlContent = ` <!DOCTYPE html><html><head>${styleMail}</head><body>${correo.html}${firma}</body></html>`;
          const sender = "desarrollo@predyc.com";
          //const recipients = [correo.user.email];
          const recipients = ['andres.gonzalez@predyc.com'];
          const subject = `Tu progreso semanal en PREDYC`;
          const cc = ["desarrollo@predyc.com,arturo.romero@predyc.com"];
          const mailObj = { sender, recipients, subject, cc, htmlContent };
          console.log(mailObj)
          _sendMailHTML(mailObj);
        });
      }


  }
  catch(error){
    throw error.message

  }


}

function generateUsersProgressTableHTML(monthCourses: any[]): string {
  let html = `
    <table>
      <tbody>
  `;

  monthCourses.forEach(month => {
    html += `
      <tr class="month-row">
        <td colspan="3" class="month-name">${titleCase(month.monthName)} ${month.yearNumber}</td>
      </tr>
      <tr>
        <th>Curso</th>
        <th>Progreso</th>
        <th>Estatus</th>
      </tr>
    `;

    const today = new Date().getTime();
    let targetComparisonDate = today;
    let lastDayPast = obtenerUltimoDiaDelMesAnterior(targetComparisonDate);

    month.courses.forEach(course => {
      let retrasado = false;
      if (course.dateEndPlan && (course.dateEndPlan.seconds * 1000) <= lastDayPast) {
        retrasado = true;
      }
      const progressText = `${course.progress.toFixed(2)}%`;
      let statusText = '';
      if (course.progress === 100) {
        statusText = '<span class="high">Completado</span>';
      } else if (retrasado) {
        statusText = '<span class="low">Retrasado</span>';
      } else {
        statusText = '<span> - </span>';
      }
      html += `
        <tr>
          <td>${course.courseTitle}</td>
          <td style="text-align: center;">${progressText}</td>
          <td style="text-align: center;">${statusText}</td>
        </tr>
      `;
    });
  });

  html += `
      </tbody>
    </table>
  `;

  return html;
}


function buildMonths(coursesByStudent: CourseByStudent[], coursesData) {

  const months = {};
  coursesByStudent.forEach((courseByStudent) => {
    // console.log("courseByStudent.id", courseByStudent.id)
    const courseData = coursesData.find(
      (courseData) => courseData.id === courseByStudent.courseRef.id
    );

    if (courseData) {
      // this.studyPlanDuration+=courseData.duracion ;
      const studyPlanData = {
        duration: courseData.duracion / 60,
        courseTitle: courseData.titulo,
        dateStartPlan: firestoreTimestampToNumberTimestamp(
          courseByStudent.dateStartPlan
        ),
        dateEndPlan: firestoreTimestampToNumberTimestamp(
          courseByStudent.dateEndPlan
        ),
        dateStart: firestoreTimestampToNumberTimestamp(
          courseByStudent.dateStart
        ),
        dateEnd: firestoreTimestampToNumberTimestamp(courseByStudent.dateEnd),
        progress:courseByStudent.progress,
        finalScore: courseByStudent.finalScore,
        id: courseByStudent.courseRef.id,
      };

      const monthName = new Date(studyPlanData.dateEndPlan).toLocaleString(
        "es",
        { month: "long", year: "2-digit" }
      );

      if (!months[monthName]) {
        months[monthName] = [];
      }

      // Add course to the related month
      months[monthName].push(studyPlanData);
    } else {
      console.log("No exite el curso");
      return;
    }
  });
  // Transform data to the desired structure
  const monthsResp = Object.keys(months).map((monthName) => {
    const date = new Date(months[monthName][0].dateEndPlan);
    const monthNumber = date.getUTCMonth();
    const yearNumber = date.getUTCFullYear();
    const realMonthname = date.toLocaleString("es", { month: "long" });
    const sortedCourses = months[monthName].sort((a, b) => {
      return a.dateEndPlan - b.dateEndPlan;
    });

    return {
      monthName: realMonthname,
      monthNumber,
      yearNumber,
      courses: sortedCourses,
    };
  });
  
  monthsResp.sort((a, b) => {
    const yearDiff = a.yearNumber - b.yearNumber;
    if (yearDiff !== 0) return yearDiff;
    return a.monthNumber - b.monthNumber;
  });

  return monthsResp;

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







  