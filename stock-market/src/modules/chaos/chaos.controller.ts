import { Controller } from "@nestjs/common";
import { Post } from "@nestjs/common/decorators";
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";

@ApiTags('chaos')
@Controller('chaos')
export class ChaosController {
    @ApiOperation({
        summary: 'Terminate instance',
        description: 'Kills the current application instance to simulate failure.'
    })
    @ApiOkResponse({
        description: 'Instance terminated'
    })
    @Post()
    public kill(){
        process.exit(1);
    }
}