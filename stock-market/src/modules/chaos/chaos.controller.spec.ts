import { Test, TestingModule } from '@nestjs/testing';
import { ChaosController } from './chaos.controller';

describe('ChaosController', () => {
    let controller: ChaosController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ChaosController],
        }).compile();

        controller = module.get<ChaosController>(ChaosController);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('kill', () => {
        it('should call process.exit with 1', () => {
            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { return undefined as never; });

            controller.kill();

            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });
});
