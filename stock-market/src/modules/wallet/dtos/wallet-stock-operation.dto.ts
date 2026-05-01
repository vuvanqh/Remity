import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString,  } from "class-validator";

export class WalletStockOperationDto {
    @ApiProperty({enum: ['buy', 'sell']})
    @IsString() @IsNotEmpty() @IsIn(['buy', 'sell'])
    type!: "buy" | "sell"
}