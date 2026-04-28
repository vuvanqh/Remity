import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Stock } from "../../../database/types/stock.types";


@Injectable()
export class TradePolicy {

    public ensureBuyAllowed(stock: Stock | undefined) {
        if (!stock)
            throw new NotFoundException('Stock does not exist');

        if (stock.quantity <= 0)
            throw new BadRequestException('Stock is out of stock');
    }

    public ensureSellAllowed(stock: Stock | undefined, walletQuantity: number) {
        if (!stock)
            throw new NotFoundException('Stock does not exist');

        if (walletQuantity <= 0)
            throw new BadRequestException(`Wallet does not have sufficient amount of stock '${stock.name}' to sell`);
    }
}
