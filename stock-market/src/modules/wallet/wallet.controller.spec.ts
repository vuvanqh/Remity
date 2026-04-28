import { Test, TestingModule } from '@nestjs/testing'
import { WalletController } from './wallet.controller'
import { WalletService } from './wallet.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'

describe('WalletController', () => {
  let controller: WalletController
  let walletService: jest.Mocked<WalletService>

  beforeEach(async () => {
    walletService = {
      getWalletStocks: jest.fn(),
      getWalletStockQuantity: jest.fn(),
      buyStock: jest.fn(),
      sellStock: jest.fn(),
    } as unknown as jest.Mocked<WalletService>

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: walletService,
        },
      ],
    }).compile()

    controller = module.get<WalletController>(WalletController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getWalletStocks', () => {
    it('returns wallet stocks for valid wallet', async () => {
      const walletId = 'wallet-1'
      const expectedResponse = {
        id: 'wallet-1',
        stocks: [
          { name: 'ABC', quantity: 5 },
          { name: 'XYZ', quantity: 3 },
        ],
      }
      walletService.getWalletStocks.mockResolvedValueOnce(expectedResponse as any)

      const result = await controller.getWalletStocks(walletId)

      expect(result).toEqual(expectedResponse)
      expect(walletService.getWalletStocks).toHaveBeenCalledWith('wallet-1')
      expect(walletService.getWalletStocks).toHaveBeenCalledTimes(1)
    })

    it('throws NotFoundException when wallet does not exist', async () => {
      walletService.getWalletStocks.mockRejectedValueOnce(new NotFoundException('Wallet not found'))

      await expect(controller.getWalletStocks('wallet-1')).rejects.toThrow(NotFoundException)
    })

    it('returns wallet with empty stocks list', async () => {
      const expectedResponse = {
        id: 'wallet-1',
        stocks: [],
      }
      walletService.getWalletStocks.mockResolvedValueOnce(expectedResponse as any)

      const result = await controller.getWalletStocks('wallet-1')

      expect(result.stocks).toHaveLength(0)
    })
  })

  describe('getWalletStockQuantity', () => {
    it('returns stock quantity for wallet and stock', async () => {
      walletService.getWalletStockQuantity.mockResolvedValueOnce(10)

      const result = await controller.getWalletStockQuantity('wallet-1', 'ABC')

      expect(result).toBe(10)
      expect(walletService.getWalletStockQuantity).toHaveBeenCalledWith('wallet-1', 'ABC')
    })

    it('returns 0 when wallet does not own the stock', async () => {
      walletService.getWalletStockQuantity.mockResolvedValueOnce(0)

      const result = await controller.getWalletStockQuantity('wallet-1', 'ABC')

      expect(result).toBe(0)
    })

    it('throws NotFoundException when wallet does not exist', async () => {
      walletService.getWalletStockQuantity.mockRejectedValueOnce(new NotFoundException('Wallet not found'))

      await expect(controller.getWalletStockQuantity('wallet-1', 'ABC')).rejects.toThrow(NotFoundException)
    })
  })

  describe('manageWallet (buy stock)', () => {
    it('buys stock when operation type is buy', async () => {
      const operation = { type: 'buy' as const }
      walletService.buyStock.mockResolvedValueOnce(undefined)

      await controller.manageWallet('wallet-1', 'ABC', operation)

      expect(walletService.buyStock).toHaveBeenCalledWith('wallet-1', 'ABC')
      expect(walletService.sellStock).not.toHaveBeenCalled()
    })

    it('throws BadRequestException when buying out of stock', async () => {
      const operation = { type: 'buy' as const }
      walletService.buyStock.mockRejectedValueOnce(new BadRequestException('Stock is out of stock'))

      await expect(controller.manageWallet('wallet-1', 'ABC', operation)).rejects.toThrow(BadRequestException)
    })

    it('throws NotFoundException when stock does not exist during buy', async () => {
      const operation = { type: 'buy' as const }
      walletService.buyStock.mockRejectedValueOnce(new NotFoundException('Stock does not exist'))

      await expect(controller.manageWallet('wallet-1', 'ABC', operation)).rejects.toThrow(NotFoundException)
    })
  })

  describe('manageWallet (sell stock)', () => {
    it('sells stock when operation type is sell', async () => {
      const operation = { type: 'sell' as const }
      walletService.sellStock.mockResolvedValueOnce(undefined)

      await controller.manageWallet('wallet-1', 'ABC', operation)

      expect(walletService.sellStock).toHaveBeenCalledWith('wallet-1', 'ABC')
      expect(walletService.buyStock).not.toHaveBeenCalled()
    })

    it('throws NotFoundException when wallet does not exist during sell', async () => {
      const operation = { type: 'sell' as const }
      walletService.sellStock.mockRejectedValueOnce(new NotFoundException('Wallet not found'))

      await expect(controller.manageWallet('wallet-1', 'ABC', operation)).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException when wallet has insufficient stock', async () => {
      const operation = { type: 'sell' as const }
      walletService.sellStock.mockRejectedValueOnce(
        new BadRequestException("Wallet does not have sufficient amount of stock 'ABC' to sell"),
      )

      await expect(controller.manageWallet('wallet-1', 'ABC', operation)).rejects.toThrow(BadRequestException)
    })

    it('throws NotFoundException when stock does not exist during sell', async () => {
      const operation = { type: 'sell' as const }
      walletService.sellStock.mockRejectedValueOnce(new NotFoundException('Stock does not exist'))

      await expect(controller.manageWallet('wallet-1', 'ABC', operation)).rejects.toThrow(NotFoundException)
    })
  })
})
