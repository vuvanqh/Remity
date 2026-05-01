import {
    Insertable,
    Selectable,
    Updateable,
    ColumnType,
    Generated,
} from 'kysely'

export interface AuditLogsTable {
    id: Generated<number>
    type: "buy" | "sell"
    wallet_id: string
    stock_name: string
    createdAt: ColumnType<Date, Date | undefined, never>
}

export type AuditLog = Selectable<AuditLogsTable>;
export type NewAuditLog = Insertable<AuditLogsTable>;
export type UpdateAuditLog = Updateable<AuditLogsTable>;
