import { Controller } from "@nestjs/common";
import { Post } from "@nestjs/common/decorators";


@Controller('chaos')
export class ChaosController {
    @Post()
    public kill(){
        process.exit(1);
    }
}