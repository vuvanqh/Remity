import { AuditLogService } from './audit-log.service';
import { Controller } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";

@ApiTags('audit-log')
@Controller('log')
export class AuditLogController {
    constructor(private readonly auditLogsService: AuditLogService) {}

    @ApiOperation({
        summary: 'Get audit log',
        description: 'Returns all successful wallet operations in chronological order.'
    })
    @ApiOkResponse({
        description: 'Audit log retrieved successfully'
    })
    @Get()
    public async getAuditLogs() {
        const log = await this.auditLogsService.getAuditLogs();
        return {log};
    }
}
