import { DocumentReference } from "@angular/fire/compat/firestore"
import { Category } from "./category.model"
import { Author } from "./author.model"

export interface ArticleJson {
    authorRef: DocumentReference<Author>
    categories: Array<typeof Article.CATEGORY_ARTICLE_OPTION | typeof Article.CATEGORY_INTERVIEW_OPTION | typeof Article.CATEGORY_SUCCEED_OPTION>
    createdAt: any
    id: string
    photoUrl: string
    pillarsRef: DocumentReference<Category>[]
    slug: string
    summary: string
    tagsRef: DocumentReference<ArticleTag>[]
    title: string
    updatedAt: any
}

export class Article {

    public static collection = 'article'
    public static subcollectionName = "dataChunks"

    public static CATEGORY_ARTICLE_OPTION = 'Artículo'
    public static CATEGORY_INTERVIEW_OPTION = 'Entrevista'
    public static CATEGORY_SUCCEED_OPTION = 'Caso de éxito'
    public static CATEGORY_OPTIONS = [
        this.CATEGORY_ARTICLE_OPTION,
        this.CATEGORY_INTERVIEW_OPTION,
        this.CATEGORY_SUCCEED_OPTION
    ]

    constructor(
        public authorRef: DocumentReference<Author>,
        public categories: Array<typeof Article.CATEGORY_ARTICLE_OPTION | typeof Article.CATEGORY_INTERVIEW_OPTION | typeof Article.CATEGORY_SUCCEED_OPTION>,
        public createdAt: any,
        public id: string,
        public photoUrl: string,
        public pillarsRef: DocumentReference<Category>[],
        public slug: string,
        public summary: string,
        public tagsRef: DocumentReference<ArticleTag>[],
        public title: string,
        public updatedAt: any,

    ) {}

    public static fromJson(articleJson: ArticleJson): Article {
        return new Article(
            articleJson.authorRef,
            articleJson.categories,
            articleJson.createdAt,
            articleJson.id,
            articleJson.photoUrl,
            articleJson.pillarsRef,
            articleJson.slug,
            articleJson.summary,
            articleJson.tagsRef,
            articleJson.title,
            articleJson.updatedAt,
        )
    }

    public toJson(): ArticleJson {
        return {
            authorRef: this.authorRef,
            categories: this.categories,
            createdAt: this.createdAt,
            id: this.id,
            photoUrl: this.photoUrl,
            pillarsRef: this.pillarsRef,
            slug: this.slug,
            summary: this.summary,
            tagsRef: this.tagsRef,
            title: this.title,
            updatedAt: this.updatedAt,
        }
    }
}

export interface ArticleSubCollectionData {
    content: Object[]
}

export interface ArticleTagJson {
    id: string | null,
    name: string,
}

export class ArticleTag {

    public static collection = 'article-tag'

    constructor(
        public id: string | null,
        public name: string,
    ){}

    public static fromJson(articleJson: ArticleTagJson): ArticleTag {
        return new ArticleTag(
            articleJson.id,
            articleJson.name,
        )
    }

    public toJson(): ArticleTagJson {
        return {
            id: this.id,
            name: this.name,
        }
    }

}