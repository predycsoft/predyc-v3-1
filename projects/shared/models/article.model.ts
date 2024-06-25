export interface ArticleJson {
    author: string
    createdAt: any
    id: string
    tags: string[]
    title: string
    updatedAt: any
}

export class Article {

    public static collection = 'article'
    public static subcollectionName = "dataChunks"

    constructor(
        public author: string,
        public createdAt: any,
        public id: string,
        public tags: string[],
        public title: string,
        public updatedAt: any,

    ) {}

    public static fromJson(articleJson: ArticleJson): Article {
        return new Article(
            articleJson.author,
            articleJson.createdAt,
            articleJson.id,
            articleJson.tags,
            articleJson.title,
            articleJson.updatedAt,
        )
    }

    public toJson(): ArticleJson {
        return {
            author: this.author,
            createdAt: this.createdAt,
            id: this.id,
            tags: this.tags,
            title: this.title,
            updatedAt: this.updatedAt,
        }
    }
}

export interface ArticleSubCollectionData {
    content: Object[]
}