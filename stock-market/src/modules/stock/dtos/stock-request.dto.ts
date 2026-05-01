import { IsInt, Min, IsString, IsNotEmpty } from "class-validator";
import { Type } from 'class-transformer';
import { ApiProperty } from "@nestjs/swagger";

export class SetStockRequestDto {
    @ApiProperty()
    @IsString() @IsNotEmpty()
    name!: string;

    @ApiProperty()
    @Type(() => Number) @IsInt() @Min(1)
    quantity!: number;
}