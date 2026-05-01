import { Test } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

describe('StockController', () => {

    let controller: StockController;

    const mockService = {
        getStocks: jest.fn(),
        setStocks: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module = await Test.createTestingModule({
            controllers: [StockController],
            providers: [{
                provide: StockService,
                useValue: mockService
            }]
        }).compile();

        controller = module.get(StockController);
    });

    it('should create controller', () => {
        expect(controller).toBeDefined();
    });

    it('gets all stocks', async () => {
        mockService.getStocks.mockResolvedValue([
            {name:'stock1', quantity:10}
        ]);

        const result = await controller.getStocks();

        expect(result).toEqual({stocks: [{
            name:'stock1',
            quantity: 10
        }]});
        expect(mockService.getStocks).toHaveBeenCalledTimes(1);
    });

    it('sets stocks', async () => {
        const request = [{
            name:'stock1',
            quantity:10
        }];
        mockService.setStocks.mockResolvedValue(undefined);

        await controller.setStocks(request);
        expect(mockService.setStocks).toHaveBeenCalledWith(request);
    });
});