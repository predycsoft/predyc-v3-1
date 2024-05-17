import { DocumentReference } from "@angular/fire/compat/firestore"

export interface GeneralConfigJson {
    allowAIChatFeature: boolean
    accountManagerRef: DocumentReference
    salesManagerRef: DocumentReference
}

export class GeneralConfig {

    public static collection = 'general'
    public static doc = 'config'

    constructor(
        public allowAIChatFeature: boolean,
        public accountManagerRef: DocumentReference,
        public salesManagerRef: DocumentReference,
    ) {}

    public static fromJson(QuestionJson: GeneralConfigJson): GeneralConfig {
        return new GeneralConfig(
            QuestionJson.allowAIChatFeature,
            QuestionJson.accountManagerRef,
            QuestionJson.salesManagerRef,
        )
    }

    public toJson(): GeneralConfigJson {
        return {
            allowAIChatFeature:this.allowAIChatFeature,
            accountManagerRef : this.accountManagerRef,
            salesManagerRef : this.salesManagerRef,
        }
    }
}