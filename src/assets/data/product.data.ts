import { ProductJson } from "src/shared/models/product.model";

export const productsData: ProductJson[] = [
    {
        "acceptsBankTransfer": false,
        "acceptsPaypal": true,
        "acceptsStripe": true,
        "acceptsZelle": false,
        "active": false,
        "canEnrollPrograms": false,
        "createdAt": 1679634238000,
        "canEnrollByHimself": true,
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
        "isACompanyProduct": false,
        "name": "Plan Básico",
        "paypalInfo": {
            "paypalId": "PROD-1VR48551XV9303234",
            "updatedAt": 1678764394210
        },
        "priority": 3,
        "stripeInfo": {
            "stripeId": "prod_MJpATWTYgyS5gq",
            "updatedAt": {
                "seconds": 1679634238,
                "nanoseconds": 205000000
            }
        },
    },
    {
        "active": true,
        "id": "Plan-Empresarial",
        "isACompanyProduct": true,
        "name": "Plan Empresarial",
        "acceptsPaypal": true,
        "acceptsZelle": true,
        "canEnrollByHimself": true,
        "canEnrollPrograms": true,
        "createdAt": 1679080848000,
        "paypalInfo": {
            "paypalId": "PROD-0YM379731X785025S",
            "updatedAt": 1678764794597
        },
        "stripeInfo": {
            "updatedAt": {
                "seconds": 1679080848,
                "nanoseconds": 136000000
            },
            "stripeId": "prod_NFA82F1kOe4YC8"
        },
        "acceptsBankTransfer": true,
        "priority": 1,
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
        "acceptsStripe": true,
        "description": "Plan Empresarial"
    },
    {
        "acceptsZelle": true,
        "description": "Plan Experto",
        "id": "Plan-Experto",
        "canEnrollPrograms": true,
        "createdAt": 1682617069000,
        "isACompanyProduct": false,
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
        "acceptsBankTransfer": true,
        "active": true,
        "name": "Plan Experto",
        "priority": 2,
        "stripeInfo": {
            "updatedAt": {
                "seconds": 1682617069,
                "nanoseconds": 660000000
            },
            "stripeId": "prod_MJpCrlyPoUWZIk"
        },
        "paypalInfo": {
            "paypalId": "PROD-4HP838857N2366147",
            "updatedAt": 1678764656510
        },
        "acceptsStripe": true,
        "acceptsPaypal": true,
        "canEnrollByHimself": true
    },
    {
        "name": "Rotaciones",
        "acceptsPaypal": false,
        "description": "Producto utilizado para reflejar las rotaciones de licencias",
        "features": [],
        "isACompanyProduct": true,
        "id": "Rotaciones",
        "canEnrollPrograms": true,
        "createdAt": 1695739531000,
        "paypalInfo": {
            "paypalId": "",
            "updatedAt": null
        },
        "stripeInfo": {
            "updatedAt": {
                "seconds": 1695739531,
                "nanoseconds": 513000000
            },
            "stripeId": "Rotaciones"
        },
        "canEnrollByHimself": true,
        "priority": 5,
        "active": true,
        "acceptsZelle": true,
        "acceptsStripe": true,
        "acceptsBankTransfer": true
    }
]
