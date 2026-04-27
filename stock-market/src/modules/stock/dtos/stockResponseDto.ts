import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";


export class StockResponseDto {
    @IsString() @IsNotEmpty()
    name!: string;

    @IsInt() @Min(0)
    quantity!: number;
}