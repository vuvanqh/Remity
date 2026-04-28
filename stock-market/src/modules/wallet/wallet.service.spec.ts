import { BadRequestException, NotFoundException } from '@nestjs/common'

jest.mock('../../database/kysely.provider', () => ({
  db: {
    transaction: jest.fn(),
  },
}))

import { db } from '../../database/kysely.provider'
import { WalletService } from './wallet.service'
import { WalletRepository } from './wallet.repository'
import { StockRepository } from '../stock/stock.repository'
import { TradePolicy } from './policies/trade.policy'

type Mocked<T> = {
  [P in keyof T]: T[P] extends (...args: infer A) => infer R ? jest.Mock<Promise<Awaited<R>>, A> : jest.Mock<any, any>
}

describe('WalletService', () => {
    let service: WalletService
    let walletRepository: Mocked<WalletRepository>
    let stockRepository: Mocked<StockRepository>
    let tradePolicy: Mocked<TradePolicy>
    let executeMock: jest.Mock

    beforeEach(() => {
        walletRepository = {
            findWalletById: jest.fn(),
            getWalletStocks: jest.fn(),
            getWalletStockQuantity: jest.fn(),
            createWallet: jest.fn(),
            updateWalletStock: jest.fn(),
            insertWalletStock: jest.fn(),
        } as unknown as Mocked<WalletRepository>

        stockRepository = {
            findStockByNameAsync: jest.fn(),
            updateStockQuantity: jest.fn(),
        } as unknown as Mocked<StockRepository>

        tradePolicy = {
            ensureBuyAllowed: jest.fn(),
            ensureSellAllowed: jest.fn(),
        } as unknown as Mocked<TradePolicy>

        executeMock = jest.fn(async callback => callback({} as any));
        (db.transaction as jest.Mock) = jest.fn().mockReturnValue({ execute: executeMock });
        service = new WalletService(walletRepository, stockRepository, tradePolicy)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('getWalletStocks', () => {
        it('returns wallet stocks when wallet exists', async () => {
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)
            walletRepository.getWalletStocks.mockResolvedValueOnce([
                { walletId: 'wallet1', stockName: 'stock1', quantity: 10 },
            ] as any)

            const result = await service.getWalletStocks('wallet1')

            expect(result).toEqual({
                id: 'wallet1',
                stocks: [{ name: 'stock1', quantity: 10 }],
            })
            expect(walletRepository.findWalletById).toHaveBeenCalledWith('wallet1')
            expect(walletRepository.getWalletStocks).toHaveBeenCalledWith('wallet1')
        })

        it('throws NotFoundException when wallet is not found', async () => {
            walletRepository.findWalletById.mockResolvedValueOnce(undefined)

            await expect(service.getWalletStocks('wallet1')).rejects.toThrow(NotFoundException)
            expect(walletRepository.getWalletStocks).not.toHaveBeenCalled()
        })
    })

    describe('getWalletStockQuantity', () => {
        it('returns wallet stock quantity when wallet exists', async () => {
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)
            walletRepository.getWalletStockQuantity.mockResolvedValueOnce(10)

            await expect(service.getWalletStockQuantity('wallet1', 'stock1')).resolves.toBe(10)
            expect(walletRepository.getWalletStockQuantity).toHaveBeenCalledWith('wallet1', 'stock1')
        })

        it('returns 0 when wallet stock quantity is undefined', async () => {
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)
            walletRepository.getWalletStockQuantity.mockResolvedValueOnce(undefined)

            await expect(service.getWalletStockQuantity('wallet1', 'stock1')).resolves.toBe(0)
        })

        it('throws NotFoundException when wallet is not found', async () => {
            walletRepository.findWalletById.mockResolvedValueOnce(undefined)

            await expect(service.getWalletStockQuantity('wallet1', 'stock1')).rejects.toThrow(NotFoundException)
        })
    })

    describe('buyStock', () => {
        it('creates wallet and inserts wallet stock when wallet does not exist', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            stockRepository.findStockByNameAsync.mockResolvedValueOnce({ name: 'stock1', quantity: 1 } as any)
            walletRepository.findWalletById.mockResolvedValueOnce(undefined)
            walletRepository.getWalletStockQuantity.mockResolvedValueOnce(undefined)

            await service.buyStock('wallet1', 'stock1')

            expect(walletRepository.createWallet).toHaveBeenCalledWith('wallet1', trx)
            expect(walletRepository.insertWalletStock).toHaveBeenCalledWith({
                walletId: 'wallet1',
                stockName: 'stock1', 
                quantity: 1
             },trx)
            expect(stockRepository.updateStockQuantity).toHaveBeenCalledWith('stock1', 0, trx)
            expect(tradePolicy.ensureBuyAllowed).toHaveBeenCalledWith({ name: 'stock1', quantity: 1 })
        })

        it('inserts wallet stock when wallet exists but stock is not yet in wallet', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            stockRepository.findStockByNameAsync.mockResolvedValueOnce({ name: 'stock1', quantity: 2 } as any)
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)
            walletRepository.getWalletStockQuantity.mockResolvedValueOnce(undefined)

            await service.buyStock('wallet1', 'stock1')

            expect(walletRepository.createWallet).not.toHaveBeenCalled()
            expect(walletRepository.insertWalletStock).toHaveBeenCalledWith({
                walletId: 'wallet1', 
                stockName: 'stock1', 
                quantity: 1 
            },trx)
            expect(walletRepository.updateWalletStock).not.toHaveBeenCalled()
            expect(stockRepository.updateStockQuantity).toHaveBeenCalledWith('stock1', 1, trx)
        })

        it('updates existing wallet stock when wallet exists', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            stockRepository.findStockByNameAsync.mockResolvedValueOnce({ name: 'stock1', quantity: 5 } as any)
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)
            walletRepository.getWalletStockQuantity.mockResolvedValueOnce(3)

            await service.buyStock('wallet1', 'stock1')

            expect(walletRepository.createWallet).not.toHaveBeenCalled()
            expect(walletRepository.updateWalletStock).toHaveBeenCalledWith({
                walletId: 'wallet1',
                stockName: 'stock1',
                quantity: 4 
            },trx,)
            expect(stockRepository.updateStockQuantity).toHaveBeenCalledWith('stock1', 4, trx)
        })

        it('propagates trade policy errors during buy', async () => {
            stockRepository.findStockByNameAsync.mockResolvedValueOnce(undefined)
            tradePolicy.ensureBuyAllowed.mockImplementationOnce(() => {
                throw new NotFoundException('Stock does not exist')
            })

            await expect(service.buyStock('wallet1', 'stock1')).rejects.toThrow(NotFoundException)
            expect(walletRepository.createWallet).not.toHaveBeenCalled()
            expect(stockRepository.updateStockQuantity).not.toHaveBeenCalled()
        })
    })

    describe('sellStock', () => {
        it('decreases wallet stock and increases available stock when wallet exists', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            stockRepository.findStockByNameAsync.mockResolvedValueOnce({ name: 'stock1', quantity: 7 } as any)
            walletRepository.getWalletStockQuantity.mockResolvedValueOnce(2)
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)

            await service.sellStock('wallet1', 'stock1')

            expect(tradePolicy.ensureSellAllowed).toHaveBeenCalledWith({ name: 'stock1', quantity: 7 }, 2)
            expect(walletRepository.updateWalletStock).toHaveBeenCalledWith({
                walletId: 'wallet1',
                stockName: 'stock1',
                quantity: 1 
            },trx)
            expect(stockRepository.updateStockQuantity).toHaveBeenCalledWith('stock1', 8, trx)
        })

        it('throws NotFoundException when wallet is missing', async () => {
            stockRepository.findStockByNameAsync.mockResolvedValueOnce({ name: 'stock1', quantity: 7 } as any)
            walletRepository.getWalletStockQuantity.mockResolvedValueOnce(1)
            walletRepository.findWalletById.mockResolvedValueOnce(undefined)

            await expect(service.sellStock('wallet1', 'stock1')).rejects.toThrow(NotFoundException)
            expect(walletRepository.updateWalletStock).not.toHaveBeenCalled()
            expect(stockRepository.updateStockQuantity).not.toHaveBeenCalled()
        })

        it('propagates trade policy errors during sell', async () => {
            stockRepository.findStockByNameAsync.mockResolvedValueOnce({ name: 'stock1', quantity: 7 } as any)
            walletRepository.getWalletStockQuantity.mockResolvedValueOnce(0)
            tradePolicy.ensureSellAllowed.mockImplementationOnce(() => {
                throw new BadRequestException("Wallet does not have sufficient amount of stock 'stock1' to sell")
            })

            await expect(service.sellStock('wallet1', 'stock1')).rejects.toThrow(BadRequestException)
            expect(walletRepository.findWalletById).not.toHaveBeenCalled()
            expect(walletRepository.updateWalletStock).not.toHaveBeenCalled()
            expect(stockRepository.updateStockQuantity).not.toHaveBeenCalled()
        })
    })
})
