import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository';
import { AuditLog, NewAuditLog } from '../../database/types/audit-log.types';
import { DbExecutor } from '../../database/types/dbContext';
import { db } from '../../database/kysely.provider';

@Injectable()
export class AuditLogService {
    constructor(
        private readonly auditLogRepository: AuditLogRepository,
    ){}

    public async getAuditLogs(): Promise<AuditLog[]> {
        return await this.auditLogRepository.getAuditLogs();
    }

    public async createAuditLog(auditLog: NewAuditLog, exec: DbExecutor = db): Promise<void> {
        await this.auditLogRepository.createAuditLog(auditLog, exec);
    }
}
