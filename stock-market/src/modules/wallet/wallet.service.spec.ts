import { BadRequestException, NotFoundException } from '@nestjs/common'

jest.mock('../../database/kysely.provider', () => ({
  db: {
    transaction: jest.fn().mockReturnValue({
      setIsolationLevel: jest.fn().mockReturnThis(),
      execute: jest.fn(async (callback) => callback({})),
    }),
  },
}))

import { db } from '../../database/kysely.provider'
import { WalletService } from './wallet.service'
import { WalletRepository } from './wallet.repository'
import { StockRepository } from '../stock/stock.repository'
import { AuditLogRepository } from '../audit-logs/audit-log.repository'
import { WalletStockRepository } from '../wallet-stock/wallet-stock.repository'

describe('WalletService', () => {
    let service: WalletService
    let walletRepository: jest.Mocked<WalletRepository>
    let stockRepository: jest.Mocked<StockRepository>
    let auditLogRepository: jest.Mocked<AuditLogRepository>
    let walletStockRepository: jest.Mocked<WalletStockRepository>
    let executeMock: jest.Mock

    beforeEach(() => {
        walletRepository = {
            findWalletById: jest.fn(),
            createWallet: jest.fn(),
        } as unknown as jest.Mocked<WalletRepository>

        walletStockRepository = {
            getWalletStocks: jest.fn(),
            getWalletStockQuantity: jest.fn(),
            incrementWalletStock: jest.fn(),
            decrementWalletStock: jest.fn(),
        } as unknown as jest.Mocked<WalletStockRepository>

        stockRepository = {
            incrementStockQuantity: jest.fn(),
            decrementStockQuantity: jest.fn(),
        } as unknown as jest.Mocked<StockRepository>

        auditLogRepository = {
            createAuditLog: jest.fn(),
        } as unknown as jest.Mocked<AuditLogRepository>

        executeMock = (db.transaction as jest.Mock)().execute
        service = new WalletService(walletRepository, stockRepository, auditLogRepository, walletStockRepository)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('getWalletStocks', () => {
        it('returns wallet stocks when wallet exists', async () => {
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)
            walletStockRepository.getWalletStocks.mockResolvedValueOnce([
                { wallet_id: 'wallet1', stock_name: 'stock1', quantity: 10 },
            ] as any)

            const result = await service.getWalletStocks('wallet1')

            expect(result).toEqual({
                id: 'wallet1',
                stocks: [{ name: 'stock1', quantity: 10 }],
            })
            expect(walletRepository.findWalletById).toHaveBeenCalledWith('wallet1')
            expect(walletStockRepository.getWalletStocks).toHaveBeenCalledWith('wallet1')
        })

        it('throws NotFoundException when wallet is not found', async () => {
            walletRepository.findWalletById.mockResolvedValueOnce(undefined)

            await expect(service.getWalletStocks('wallet1')).rejects.toThrow(NotFoundException)
            expect(walletStockRepository.getWalletStocks).not.toHaveBeenCalled()
        })
    })

    describe('getWalletStockQuantity', () => {
        it('returns wallet stock quantity when wallet exists', async () => {
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)
            walletStockRepository.getWalletStockQuantity.mockResolvedValueOnce(10)

            await expect(service.getWalletStockQuantity('wallet1', 'stock1')).resolves.toBe(10)
            expect(walletStockRepository.getWalletStockQuantity).toHaveBeenCalledWith('wallet1', 'stock1')
        })

        it('returns 0 when wallet stock quantity is undefined', async () => {
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)
            walletStockRepository.getWalletStockQuantity.mockResolvedValueOnce(undefined)

            await expect(service.getWalletStockQuantity('wallet1', 'stock1')).resolves.toBe(0)
        })

        it('throws NotFoundException when wallet is not found', async () => {
            walletRepository.findWalletById.mockResolvedValueOnce(undefined)

            await expect(service.getWalletStockQuantity('wallet1', 'stock1')).rejects.toThrow(NotFoundException)
        })
    })

    describe('buyStock', () => {
        it('creates wallet and buys stock when wallet does not exist', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            stockRepository.decrementStockQuantity.mockResolvedValueOnce(1)
            walletRepository.findWalletById.mockResolvedValueOnce(undefined)

            await service.buyStock('wallet1', 'stock1')

            expect(walletRepository.createWallet).toHaveBeenCalledWith('wallet1', trx)
            expect(walletStockRepository.incrementWalletStock).toHaveBeenCalledWith('wallet1', 'stock1', trx)
            expect(stockRepository.decrementStockQuantity).toHaveBeenCalledWith('stock1', trx)
            expect(auditLogRepository.createAuditLog).toHaveBeenCalledWith({
                type: 'buy',
                wallet_id: 'wallet1',
                stock_name: 'stock1',
            }, trx)
        })

        it('buys stock when wallet exists', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            stockRepository.decrementStockQuantity.mockResolvedValueOnce(1)
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)

            await service.buyStock('wallet1', 'stock1')

            expect(walletRepository.createWallet).not.toHaveBeenCalled()
            expect(walletStockRepository.incrementWalletStock).toHaveBeenCalledWith('wallet1', 'stock1', trx)
            expect(stockRepository.decrementStockQuantity).toHaveBeenCalledWith('stock1', trx)
            expect(auditLogRepository.createAuditLog).toHaveBeenCalledWith({
                type: 'buy',
                wallet_id: 'wallet1',
                stock_name: 'stock1',
            }, trx)
        })

        it('throws NotFoundException when stock does not exist', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            stockRepository.decrementStockQuantity.mockResolvedValueOnce(undefined)
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)

            await expect(service.buyStock('wallet1', 'stock1')).rejects.toThrow(NotFoundException)
            expect(walletStockRepository.incrementWalletStock).not.toHaveBeenCalled()
        })

        it('throws BadRequestException when stock is not available', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            stockRepository.decrementStockQuantity.mockResolvedValueOnce(0)
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)

            await expect(service.buyStock('wallet1', 'stock1')).rejects.toThrow(BadRequestException)
            expect(walletStockRepository.incrementWalletStock).not.toHaveBeenCalled()
        })
    })

    describe('sellStock', () => {
        it('sells stock and increases available stock when wallet exists', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)
            walletStockRepository.decrementWalletStock.mockResolvedValueOnce(1)
            stockRepository.incrementStockQuantity.mockResolvedValueOnce(1)

            await service.sellStock('wallet1', 'stock1')

            expect(walletStockRepository.decrementWalletStock).toHaveBeenCalledWith('wallet1', 'stock1', trx)
            expect(stockRepository.incrementStockQuantity).toHaveBeenCalledWith('stock1', trx)
            expect(auditLogRepository.createAuditLog).toHaveBeenCalledWith({
                type: 'sell',
                wallet_id: 'wallet1',
                stock_name: 'stock1',
            }, trx)
        })

        it('throws BadRequestException when wallet is missing', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            walletRepository.findWalletById.mockResolvedValueOnce(undefined)

            await expect(service.sellStock('wallet1', 'stock1')).rejects.toThrow(BadRequestException)
            expect(walletRepository.createWallet).toHaveBeenCalledWith('wallet1', trx)
            expect(walletStockRepository.decrementWalletStock).not.toHaveBeenCalled()
        })

        it('throws BadRequestException when wallet does not have enough stock', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)
            walletStockRepository.decrementWalletStock.mockResolvedValueOnce(0)

            await expect(service.sellStock('wallet1', 'stock1')).rejects.toThrow(BadRequestException)
            expect(stockRepository.incrementStockQuantity).not.toHaveBeenCalled()
        })

        it('throws NotFoundException when stock does not exist', async () => {
            const trx = {}
            executeMock.mockImplementationOnce(async callback => callback(trx))
            walletRepository.findWalletById.mockResolvedValueOnce({ id: 'wallet1' } as any)
            walletStockRepository.decrementWalletStock.mockResolvedValueOnce(1)
            stockRepository.incrementStockQuantity.mockResolvedValueOnce(0)

            await expect(service.sellStock('wallet1', 'stock1')).rejects.toThrow(NotFoundException)
        })
    })
})
