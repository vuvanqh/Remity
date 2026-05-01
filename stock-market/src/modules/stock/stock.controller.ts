import { StockService } from "./stock.service";
import { Body, Controller, Get, Post, HttpCode } from "@nestjs/common/decorators";
import { SetStockRequestDto } from "./dtos/stock-request.dto";
import { ApiTags,ApiOperation, ApiOkResponse, ApiBody } from "@nestjs/swagger";

@ApiTags('stocks')
@Controller('stocks')
export class StockController {
    constructor(private readonly stockService: StockService) {}

    @ApiOperation({
        summary: 'Set bank stock state',
        description: 'Replaces or initializes the bank inventory with provided stock quantities.'
    })
    @ApiBody({
        description: 'List of stocks with quantities',
        schema: {
            example: {
                stocks: [
                    { name: "stock1", quantity: 100 },
                    { name: "stock2", quantity: 50 }
                ]
            }
        }
    })
    @ApiOkResponse({
        description: 'Bank state updated successfully'
    })
    @Post()
    @HttpCode(200)
    public async setStocks(@Body('stocks') stocks: SetStockRequestDto[]) {
        await this.stockService.setStocks(stocks);
    }

    @ApiOperation({
        summary: 'Get bank state',
        description: 'Returns all stocks and their quantities available in the bank.'
    })
    @ApiOkResponse({
        description: 'Bank state retrieved successfully'
    })
    @Get()
    public async getStocks() {
        const stocks = await this.stockService.getStocks();
        return {stocks};
    }

}