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
        .orderBy('id', 'asc')
        .execute();
    }

    public createAuditLog = async (auditLog: NewAuditLog, exec: DbExecutor = db): Promise<void> => {
        await exec
        .insertInto('auditLogs')
        .values(auditLog)
        .execute();
    }
}