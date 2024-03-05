import { PriceJson } from "projects/predyc-business/src/shared/models/price.model";

export const pricesData: PriceJson[] = [ 
    {
        "active": false,
        "amount": 49,
        "coupon": null,
        "createdAt": 1679037437000,
        "currency": "USD",
        "freeTrialDays": 5,
        "id": "Plan-Basico-49USD-month",
        "interval": "month",
        "intervalCount": 1,
        "paypalInfo": {
            "updatedAt": 1678764963949,
            "paypalId": "P-8UA59212X34203740MQH6XIY"
        },
        "product": null,
        "stripeInfo": {
            "updatedAt": {
                "seconds": 1679037437,
                "nanoseconds": 203000000
            },
            "stripeId": "price_1LbBWRG5OTwAmy4XhfGca2vT"
        },
        "type": "recurring",
    },
    {
        "currency": "USD",
        "intervalCount": 1,
        "stripeInfo": {
            "stripeId": "price_1MmXUBG5OTwAmy4XT4XeV2l2",
            "updatedAt": {
                "seconds": 1679634321,
                "nanoseconds": 595000000
            }
        },
        "amount": 98,
        "coupon": null,
        "createdAt": 1679634321000,
        "interval": "month",
        "id": "Plan-Basico-98USD-month",
        "paypalInfo": {
            "updatedAt": null,
            "paypalId": ""
        },
        "active": false,
        "type": "recurring",
        "freeTrialDays": 5,
        "product": null,
    },
    {
        "coupon": null,
        "createdAt": 1679080897000,
        "active": true,
        "amount": 468,
        "freeTrialDays": 5,
        "paypalInfo": {
            "paypalId": "P-7FT24822K62995017MQH626Q",
            "updatedAt": 1678765434547
        },
        "product": null,
        "type": "recurring",
        "id": "Plan-Empresarial-468USD-year",
        "intervalCount": 1,
        "currency": "USD",
        "interval": "year",
        "stripeInfo": {
            "updatedAt": {
                "seconds": 1679080897,
                "nanoseconds": 567000000
            },
            "stripeId": "price_1MUfo0G5OTwAmy4XVquvMzrN"
        }
    },
    {
        "active": false,
        "id": "Plan-Empresarial-500USD-year",
        "currency": "USD",
        "type": "recurring",
        "interval": "year",
        "coupon": null,
        "createdAt": 1683225030000,
        "freeTrialDays": 5,
        "stripeInfo": {
            "stripeId": "",
            "updatedAt": null
        },
        "intervalCount": 1,
        "amount": 500,
        "product": null,
        "paypalInfo": {
            "paypalId": "",
            "updatedAt": null
        }
    },
    {
        "intervalCount": 1,
        "type": "recurring",
        "coupon": null,
        "createdAt": 1683225030000,
        "amount": 468,
        "product": null,
        "id": "Plan-Experto-468USD-year",
        "paypalInfo": {
            "paypalId": "P-21P46331DM9200618MQH6ZVA",
            "updatedAt": 1678765268665
        },
        "active": true,
        "freeTrialDays": 0,
        "stripeInfo": {
            "stripeId": "price_1LbBY4G5OTwAmy4XoSq4qzWp",
            "updatedAt": {
                "seconds": 1683225030,
                "nanoseconds": 534000000
            }
        },
        "currency": "USD",
        "interval": "year"
    },
    {
        "type": "recurring",
        "intervalCount": 1,
        "id": "Plan-Experto-500USD-year",
        "paypalInfo": {
            "updatedAt": null,
            "paypalId": ""
        },
        "amount": 500,
        "currency": "USD",
        "product": null,
        "coupon": null,
        "createdAt": 1683225030000,
        "stripeInfo": {
            "stripeId": "",
            "updatedAt": null
        },
        "freeTrialDays": 5,
        "interval": "year",
        "active": false
    },
    {
        "currency": "USD",
        "id": "Rotaciones-120USD-month",
        "amount": 120,
        "intervalCount": 1,
        "freeTrialDays": 0,
        "interval": "month",
        "paypalInfo": {
            "updatedAt": null,
            "paypalId": ""
        },
        "active": false,
        "type": "one_time",
        "coupon": null,
        "createdAt": 1695738693000,
        "stripeInfo": {
            "updatedAt": {
                "seconds": 1695738693,
                "nanoseconds": 500000000
            },
            "stripeId": "price_1NucI7G5OTwAmy4X50qjskAy"
        },
        "product": null
    }
]