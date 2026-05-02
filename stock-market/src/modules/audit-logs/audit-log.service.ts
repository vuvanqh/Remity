import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository';
import { NewAuditLog } from '../../database/types/audit-log.types';
import { DbExecutor } from '../../database/types/dbContext';
import { AuditLogResponseDto } from './dtos/audit-log-response.dto';

@Injectable()
export class AuditLogService {
    constructor(
        private readonly auditLogRepository: AuditLogRepository,
    ){}

    public async getAuditLogs(): Promise<AuditLogResponseDto[]> {
        let logs = await this.auditLogRepository.getAuditLogs();
        return logs.map(log => {
            return {
                type: log.type,
                wallet_id: log.wallet_id,
                stock_name: log.stock_name,
            }
        });
    }

    public async createAuditLog(auditLog: NewAuditLog, exec: DbExecutor): Promise<void> {
        await this.auditLogRepository.createAuditLog(auditLog, exec);
    }
}
