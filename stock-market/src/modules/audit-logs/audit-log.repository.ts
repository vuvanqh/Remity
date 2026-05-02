import { db } from "../../database/kysely.provider";
import { Injectable } from "@nestjs/common";
import { DbExecutor } from "../../database/types/dbContext";
import { AuditLog, NewAuditLog } from "../../database/types/audit-log.types";

@Injectable()
export class AuditLogRepository {
    public getAuditLogs = async (exec: DbExecutor = db): Promise<AuditLog[]> => {
        return await exec
        .selectFrom('auditLogs')
        .selectAll()
        .orderBy('createdAt', 'asc')
        .execute();
    }

    public createAuditLog = async (auditLog: NewAuditLog, exec: DbExecutor): Promise<void> => {
        await exec
        .insertInto('auditLogs')
        .values({
            type: auditLog.type,
            wallet_id: auditLog.wallet_id,
            stock_name: auditLog.stock_name,
        })
        .execute();
    }
}