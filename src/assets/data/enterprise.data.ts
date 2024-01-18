import { EnterpriseJson } from 'src/app/shared/models/enterprise.model'

export const enterpriseData: EnterpriseJson = {
    city: "Santiago de Querétaro",
    country: "México",
    createdAt: 1695141743802,
    description: "Esta es una empresa de prueba",
    employesNo: 0,
    id: null,
    name: "Empresa de prueba",
    // totalAlertNotifications: 0,
    // totalEventNotifications: 0,
    // totalReadByAdminNotifications: 0,
    permissions: {
        hoursPerWeek: 8,
        studyLiberty: 'Estricto',
        studyplanGeneration: 'Confirmar',
        attemptsPerTest: 5
    },
    photoUrl: null,
    profilesNo: 0,
    zipCode: 78904,
    workField: "Energías renovables",
    socialNetworks: {
        facebook: null,
        instagram: null,
        website: null,
        linkedin: null
    },
    vimeoFolderId: null,
    vimeoFolderUri: null,
}