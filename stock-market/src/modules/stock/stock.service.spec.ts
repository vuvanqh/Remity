import {Test} from '@nestjs/testing';
import { StockService } from './stock.service';
import { StockRepository } from './stock.repository';
import { NotFoundException } from '@nestjs/common';

jest.mock('../../database/kysely.provider', () => ({
  db: {
    transaction: jest.fn().mockReturnValue({
      setAccessMode: jest.fn().mockReturnThis(),
      setIsolationLevel: jest.fn().mockReturnThis(),
      execute: jest.fn(async (callback) => callback({})),
    }),
  },
}))

describe('StockService', () => {
    let service: StockService;
    let mockRepo: jest.Mocked<StockRepository>;
  
    beforeEach(async () => {
        jest.clearAllMocks();
        mockRepo = {
            getAllStocks: jest.fn(),
            findStockByNameAsync: jest.fn(),
            createStock: jest.fn(),
            setStock: jest.fn(),
        } as unknown as jest.Mocked<StockRepository>;

        const module = await Test.createTestingModule({
            providers: [
                StockService,
                {
                    provide: StockRepository,
                    useValue: mockRepo,
                },
            ],
        }).compile();
        service = module.get(StockService);
    });

    it('should create service', async () => {
        expect(service).toBeDefined();
    })

    it('returns all stocks', async () => {
        mockRepo.getAllStocks.mockResolvedValue([
            { name: 'stock1', quantity: 10 },
            { name: 'stock2', quantity: 20 },
        ]);

        const result = await service.getStocks();
        expect(result).toEqual([
            { name: 'stock1', quantity: 10 },
            { name: 'stock2', quantity: 20 },
        ]);

        expect(mockRepo.getAllStocks).toHaveBeenCalledTimes(1);
    })

    it('returns a stock by name', async () => {
        mockRepo.findStockByNameAsync.mockResolvedValue({
            name: 'stock1',
            quantity: 10
        });

        const result = await service.getStock('stock1');

        expect(result).toEqual({
            name: 'stock1',
            quantity: 10
        });
        expect(mockRepo.findStockByNameAsync).toHaveBeenCalledWith('stock1');
    });

    it('throws if stock does not exist', async () => {
        mockRepo.findStockByNameAsync.mockResolvedValue(undefined);
        await expect(service.getStock('stock1')).rejects.toBeInstanceOf(NotFoundException);
    })

    it('creates new stock if does not exist', async () => {
        mockRepo.findStockByNameAsync.mockResolvedValue(undefined);
        
        await service.setStocks([
            { name: 'stock1', quantity: 10 },
        ]);

        expect(mockRepo.createStock).toHaveBeenCalledWith({
            name: 'stock1',
            quantity: 10,
        }, expect.anything());

        expect(mockRepo.setStock).not.toHaveBeenCalled();
    })

    it('updates stock if already exists', async () => {
        mockRepo.findStockByNameAsync.mockResolvedValue({
            name: 'stock1',
            quantity: 10,
        });

        await service.setStocks([
            { name: 'stock1', quantity: 20 },
        ]);

        expect(mockRepo.createStock).not.toHaveBeenCalled();
        expect(mockRepo.setStock).toHaveBeenCalledWith({
            name: 'stock1',
            quantity: 20,
        }, expect.anything());
    })

    it('updates multiple existing stocks', async () => {
        mockRepo.findStockByNameAsync
        .mockResolvedValue({
            name:'existing',
            quantity: 1
        });

        await service.setStocks([
        {name:'stock1', quantity:10},
        {name:'stock2', quantity:20},
        ]);

        expect(mockRepo.setStock).toHaveBeenCalledTimes(2);
        expect(mockRepo.setStock).toHaveBeenNthCalledWith(1,
        {
            name:'stock1',
            quantity:10
        },expect.anything());

        expect(mockRepo.setStock).toHaveBeenNthCalledWith(2,
        {
            name:'stock2',
            quantity:20
        },expect.anything());

        expect(mockRepo.createStock).not.toHaveBeenCalled();
    });

    it('handles mixed create and update', async () => {
        mockRepo.findStockByNameAsync
        .mockResolvedValueOnce({
            name: 'stock1',
            quantity: 10,
        })
        .mockResolvedValueOnce(undefined);

        await service.setStocks([
            {name: 'stock1', quantity: 10},
            {name: 'stock2', quantity: 20},
        ])

        expect(mockRepo.createStock).toHaveBeenCalledTimes(1);
        expect(mockRepo.createStock).toHaveBeenCalledWith({
            name: 'stock2',
            quantity: 20,
        }, expect.anything());

        expect(mockRepo.setStock).toHaveBeenCalledTimes(1);
        expect(mockRepo.setStock).toHaveBeenCalledWith({
            name: 'stock1',
            quantity: 10,   
        }, expect.anything());
    })

    it('handles empty stock list', async () => {
        await service.setStocks([]);

        expect(mockRepo.createStock).not.toHaveBeenCalled();
        expect(mockRepo.setStock).not.toHaveBeenCalled();
    });
});