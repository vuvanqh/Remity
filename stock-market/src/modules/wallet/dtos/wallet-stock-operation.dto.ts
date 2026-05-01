import { IsIn, IsNotEmpty, IsString,  } from "class-validator";

export class WalletStockOperationDto {
    @IsString() @IsNotEmpty() @IsIn(['buy', 'sell'])
    type!: "buy" | "sell"
}