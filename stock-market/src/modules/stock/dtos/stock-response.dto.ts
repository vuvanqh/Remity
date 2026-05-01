import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";


export class StockResponseDto {
    @ApiProperty()
    @IsString() @IsNotEmpty()
    name!: string;

    @ApiProperty()
    @IsInt() @Min(0)
    quantity!: number;
}