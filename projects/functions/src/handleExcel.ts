import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as XLSX from 'xlsx';

export const createProfilesFromExcel = functions.https.onCall(
    async (data, _) => {
        try {
            const file = 'src/example.xlsx'; // Replace with your file name
            const workbook = XLSX.readFile(file);
            const data= []
            for (let sheetName of workbook.SheetNames) {
                const firstSheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
                const excelData: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                const arrayOfCourses = []
                for (let row of excelData) {
                    for (let col of row) {
                        arrayOfCourses.push(col)
                    }
                }
                data.push({
                    id: null,
                    name: sheetName,
                    description: "",
                    coursesRef: arrayOfCourses,
                    enterpriseRef: null,
                    permissions: {
                      hoursPerWeek: 1,
                      studyLiberty: 'Libre',
                      studyplanGeneration: 'Optimizada',
                      attemptsPerTest: 1
                    },
                    hoursPerMonth: 8
                })
                // console.log(sheetName, data);
                console.log(sheetName)
            }
            return data
        } catch (error: any) {
            console.log(error)
            return false
        } 
    }
);