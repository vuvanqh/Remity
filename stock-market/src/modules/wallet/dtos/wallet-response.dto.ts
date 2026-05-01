import { ApiProperty } from "@nestjs/swagger";
import { StockResponseDto } from "../../stock/dtos/stock-response.dto";
import { IsNotEmpty, IsString } from "class-validator";

export class WalletResponse {
    @ApiProperty()
    @IsString() @IsNotEmpty()
    id!: string;

    @ApiProperty({
        type: StockResponseDto,
        isArray: true,
    })
    stocks!: StockResponseDto[];
}