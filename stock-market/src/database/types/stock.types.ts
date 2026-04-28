import {
    Insertable,
    Selectable,
    Updateable,
} from 'kysely'

export interface StocksTable {
    name: string
    quantity: number
}

export type Stock = Selectable<StocksTable>;
export type NewStock = Insertable<StocksTable>;
export type UpdateStock = Updateable<StocksTable>;