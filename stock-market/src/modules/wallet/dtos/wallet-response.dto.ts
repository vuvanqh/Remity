import { StockResponseDto } from "../../stock/dtos/stock-response.dto";

export type WalletResponse = {
    id: string;
    stocks: StockResponseDto[];
}