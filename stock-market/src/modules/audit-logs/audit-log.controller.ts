import { AuditLogService } from './audit-log.service';
import { Controller } from '@nestjs/common';
import { Get } from '@nestjs/common';

@Controller('log')
export class AuditLogController {
    constructor(private readonly auditLogsService: AuditLogService) {}

    @Get()
    public async getAuditLogs() {
        const log = await this.auditLogsService.getAuditLogs();
        return {log};
    }
}
