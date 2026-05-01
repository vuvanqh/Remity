import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";

@ApiTags('health')
@Controller('health')
export class HealthController {
    @ApiOperation({
        summary: 'Health check',
        description: 'Returns service liveness status.'
    })
    @ApiOkResponse({
        description: 'Service is healthy',
        schema: {
            example: { status: 'ok' }
        }
    })
    @Get()
    public health() {
        return { status: 'ok' };
    }
}