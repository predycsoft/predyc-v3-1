import { ProductJson } from "projects/shared/models/product.model";

export const productsData: ProductJson[] = [
    {
        "active": false,
        "amount": 49,
        "autodeactivate": false,
        "accesses": {
            "enableUserRadar": false,
            "enableStudyPlanView": false,
            "enableExtraCoursesView": false,
            "enableToTakeTest": false,
            "enableCreateParticularCourses": false,
        },
        "createdAt": 1679634238000,
        "description": "Plan Básico",
        "features": [
            {
                "text": "Acceso a mas de 50 cursos",
                "isActive": true
            },
            {
                "isActive": true,
                "text": "Certificado de completación de cursos"
            },
            {
                "text": "Flexibilidad de aprendizaje 24/7",
                "isActive": true
            },
            {
                "text": "Acceso a material descargable",
                "isActive": true
            },
            {
                "isActive": true,
                "text": "Acceso en todos los dispositivos"
            },
            {
                "isActive": true,
                "text": "Foro de preguntas y respuestas al instructor"
            },
            {
                "isActive": false,
                "text": "Acceso a todos nuestros programas"
            },
            {
                "text": "Certificado de completación de programas",
                "isActive": false
            }
        ],
        "id": "Plan-Basico",
        "name": "Plan Básico",
    },
    {
        "active": true,
        "amount": 672,
        "autodeactivate": false,
        "accesses": {
            "enableUserRadar": false,
            "enableStudyPlanView": false,
            "enableExtraCoursesView": false,
            "enableToTakeTest": false,
            "enableCreateParticularCourses": false,
        },
        "id": "Plan-Empresarial",
        "name": "Plan Empresarial",
        "createdAt": 1679080848000,
        "features": [
            {
                "text": "Todos los beneficios del plan experto",
                "isActive": true
            },
            {
                "isActive": true,
                "text": "Monitoreo de KPIs"
            },
            {
                "text": "Reportes trimestrales",
                "isActive": true
            },
            {
                "text": "Creación de cronogramas",
                "isActive": true
            },
            {
                "isActive": true,
                "text": "Rotación de usuarios"
            },
            {
                "isActive": true,
                "text": "Soporte y capacitación de uso"
            }
        ],
        "description": "Plan Empresarial"
    },
    {
        "description": "Plan Experto",
        "id": "Plan-Experto",
        "createdAt": 1682617069000,
        "features": [
            {
                "isActive": true,
                "text": "Acceso a mas de 50 cursos"
            },
            {
                "text": "Certificado de completación de cursos",
                "isActive": true
            },
            {
                "isActive": true,
                "text": "Flexibilidad de aprendizaje 24/7"
            },
            {
                "isActive": true,
                "text": "Acceso a material descargable"
            },
            {
                "text": "Acceso en todos los dispositivos",
                "isActive": true
            },
            {
                "isActive": true,
                "text": "Foro de preguntas y respuestas al instructor"
            },
            {
                "isActive": true,
                "text": "Acceso a todos nuestros programas"
            },
            {
                "isActive": true,
                "text": "Certificado de completación de programas"
            }
        ],
        "active": true,
        "amount": 500,
        "autodeactivate": false,
        "accesses": {
            "enableUserRadar": false,
            "enableStudyPlanView": false,
            "enableExtraCoursesView": false,
            "enableToTakeTest": false,
            "enableCreateParticularCourses": false,
        },
        "name": "Plan Experto",
    },
    {
        "name": "Rotaciones",
        "description": "Producto utilizado para reflejar las rotaciones de licencias",
        "features": [],
        "id": "Rotaciones",
        "createdAt": 1695739531000,
        "active": true,
        "amount": 173,
        "autodeactivate": false,
        "accesses": {
            "enableUserRadar": false,
            "enableStudyPlanView": false,
            "enableExtraCoursesView": false,
            "enableToTakeTest": false,
            "enableCreateParticularCourses": false,
        },
    }
]
