import { StockResponseDto } from "../../stock/dtos/stockResponseDto";

export type WalletResponse = {
    id: string;
    stocks: StockResponseDto[];
}