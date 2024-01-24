import { ProfileJson } from "src/app/shared/models/profile.model";

export const profilesData: ProfileJson[] = [
    {
      id: null,
      name: "Ingeniero de Confiabilidad",
      description: "Descripcion del 2do perfil",
      coursesRef:[],
      enterpriseRef: null,
      permissions: {
        hoursPerWeek: 1,
        studyLiberty: 'Libre',
        studyplanGeneration: 'Optimizada',
        attemptsPerTest: 1
      }
    },
    {
      id: null,
      name: "Especialista en Programación de la Producción",
      description: "Descripcion del 3er perfil",
      coursesRef:[],
      enterpriseRef: null,
      permissions: {
        hoursPerWeek: 2,
        studyLiberty: 'Estricto',
        studyplanGeneration: 'Optimizada',
        attemptsPerTest: 4
      }
    },
    {
      id: null,
      name: "Técnico de Mantenimiento Eléctrico",
      description: "Descripcion del 4to perfil",
      coursesRef:[],
      enterpriseRef: null,
      permissions: {
        hoursPerWeek: 3,
        studyLiberty: 'Solicitudes',
        studyplanGeneration: 'Confirmar',
        attemptsPerTest: 2
      }
    },
    {
      id: null,
      name: "Especialista en seguridad industrial",
      description: "Descripcion del 5to perfil",
      coursesRef:[],
      enterpriseRef: null,
      permissions: {
        hoursPerWeek: 7,
        studyLiberty: 'Estricto',
        studyplanGeneration: 'Optimizada',
        attemptsPerTest: 3
      }
    },
    {
      id: null,
      name: "Especialista en vibraciones",
      description: "Descripcion del 6to perfil",
      coursesRef:[],
      enterpriseRef: null,
      permissions: {
        hoursPerWeek: 8,
        studyLiberty: 'Estricto',
        studyplanGeneration: 'Confirmar',
        attemptsPerTest: 5
      }
    },
  ]