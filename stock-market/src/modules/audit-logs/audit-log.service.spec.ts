import { AuditLogService } from './audit-log.service'
import { AuditLogRepository } from './audit-log.repository'
import { db } from '../../database/kysely.provider'

jest.mock('../../database/kysely.provider', () => ({
  db: {},
}))

describe('AuditLogService', () => {
    let service: AuditLogService
    let auditLogRepository: jest.Mocked<AuditLogRepository>

    beforeEach(() => {
        auditLogRepository = {
        getAuditLogs: jest.fn(),
        createAuditLog: jest.fn(),
        } as unknown as jest.Mocked<AuditLogRepository>

        service = new AuditLogService(auditLogRepository)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('getAuditLogs', () => {
        it('returns audit logs from repository', async () => {
        const mockLogs = [
            { id: 1, type: 'buy', walletId: 'wallet-1', stockName: 'ABC', createdAt: new Date() },
            { id: 2, type: 'sell', walletId: 'wallet-1', stockName: 'ABC', createdAt: new Date() },
        ]
        auditLogRepository.getAuditLogs.mockResolvedValueOnce(mockLogs as any)

        const result = await service.getAuditLogs()

        expect(result).toEqual(mockLogs)
        expect(auditLogRepository.getAuditLogs).toHaveBeenCalledWith()
        })

        it('returns logs in occurrence order', async () => {
        const date1 = new Date('2026-04-28T10:00:00Z')
        const date2 = new Date('2026-04-28T10:05:00Z')
        const date3 = new Date('2026-04-28T10:10:00Z')
        const mockLogs = [
            { id: 1, type: 'buy', walletId: 'wallet-1', stockName: 'ABC', createdAt: date1 },
            { id: 2, type: 'sell', walletId: 'wallet-1', stockName: 'ABC', createdAt: date2 },
            { id: 3, type: 'buy', walletId: 'wallet-1', stockName: 'XYZ', createdAt: date3 },
        ]
        auditLogRepository.getAuditLogs.mockResolvedValueOnce(mockLogs as any)

        const result = await service.getAuditLogs()

        expect(result.length).toBe(3)
        for (let i = 1; i < result.length; i++) {
            const prevTime = result[i - 1].createdAt.getTime()
            const currTime = result[i].createdAt.getTime()
            expect(prevTime).toBeLessThanOrEqual(currTime)
        }
        })

        it('returns empty array when no logs exist', async () => {
        auditLogRepository.getAuditLogs.mockResolvedValueOnce([])

        const result = await service.getAuditLogs()

        expect(result).toEqual([])
        expect(auditLogRepository.getAuditLogs).toHaveBeenCalledTimes(1)
        })

        it('propagates repository errors', async () => {
        const error = new Error('Database connection failed')
        auditLogRepository.getAuditLogs.mockRejectedValueOnce(error)

        await expect(service.getAuditLogs()).rejects.toThrow('Database connection failed')
        })
    })

    describe('createAuditLog', () => {
        it('creates audit log with provided data', async () => {
        const newLog = {
            type: 'buy' as const,
            walletId: 'wallet-1',
            stockName: 'ABC',
            createdAt: new Date(),
        }
        const trx = {}

        await service.createAuditLog(newLog, trx as any)

        expect(auditLogRepository.createAuditLog).toHaveBeenCalledWith(newLog, trx)
        })

        it('creates audit log with default db executor when not provided', async () => {
        const newLog = {
            type: 'sell' as const,
            walletId: 'wallet-1',
            stockName: 'ABC',
            createdAt: new Date(),
        }

        await service.createAuditLog(newLog)

        expect(auditLogRepository.createAuditLog).toHaveBeenCalledWith(newLog, db)
        })

        it('propagates repository errors on creation', async () => {
        const newLog = {
            type: 'buy' as const,
            walletId: 'wallet-1',
            stockName: 'ABC',
            createdAt: new Date(),
        }
        const error = new Error('Insert failed')
        auditLogRepository.createAuditLog.mockRejectedValueOnce(error)

        await expect(service.createAuditLog(newLog)).rejects.toThrow('Insert failed')
        })
    })
})
