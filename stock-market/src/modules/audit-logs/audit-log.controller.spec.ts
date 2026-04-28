import { Test, TestingModule } from '@nestjs/testing'
import { AuditLogController } from './audit-log.controller'
import { AuditLogService } from './audit-log.service'

describe('AuditLogController', () => {
  let controller: AuditLogController
  let auditLogService: jest.Mocked<AuditLogService>

  beforeEach(async () => {
    auditLogService = {
      getAuditLogs: jest.fn(),
      createAuditLog: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        {
          provide: AuditLogService,
          useValue: auditLogService,
        },
      ],
    }).compile()

    controller = module.get<AuditLogController>(AuditLogController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAuditLogs', () => {
    it('returns audit logs from service', async () => {
      const mockLogs = [
        { id: 1, type: 'buy', walletId: 'wallet-1', stockName: 'ABC', createdAt: new Date() },
        { id: 2, type: 'sell', walletId: 'wallet-1', stockName: 'ABC', createdAt: new Date() },
      ]
      auditLogService.getAuditLogs.mockResolvedValueOnce(mockLogs as any)

      const result = await controller.getAuditLogs()

      expect(result).toEqual(mockLogs)
      expect(auditLogService.getAuditLogs).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no logs exist', async () => {
      auditLogService.getAuditLogs.mockResolvedValueOnce([])

      const result = await controller.getAuditLogs()

      expect(result).toEqual([])
    })

    it('propagates service errors', async () => {
      const error = new Error('Service error')
      auditLogService.getAuditLogs.mockRejectedValueOnce(error)

      await expect(controller.getAuditLogs()).rejects.toThrow('Service error')
    })
  })
})
