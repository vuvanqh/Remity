import { IsInt, Min, IsString } from "class-validator";
import { Type } from 'class-transformer';

export class SetStockRequestDto {
    @IsString()
    name!: string;

    @Type(() => Number) @IsInt() @Min(1)
    quantity!: number;
}