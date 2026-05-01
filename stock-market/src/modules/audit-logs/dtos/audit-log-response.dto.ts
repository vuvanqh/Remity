import { ApiProperty } from "@nestjs/swagger";

export class AuditLogResponseDto {
    @ApiProperty({ enum: ['buy', 'sell'] })
    type!: 'buy' | 'sell';

    @ApiProperty()
    wallet_id!: string;

    @ApiProperty()
    stock_name!: string;
}