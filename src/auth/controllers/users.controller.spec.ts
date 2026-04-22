import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './users.controller';
import { UserService } from '../users.service';
import { SentryInterceptor } from '@/common/interceptors/sentry.interceptor';
import { AuthGuard } from '@/common/guards/guards';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    findAll: jest.fn(),
    personalData: jest.fn(),
    updateUserInfo: jest.fn(),
  };

  const mockSentryInterceptor = {
    intercept: jest.fn().mockImplementation((context, next) => next.handle()),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideInterceptor(SentryInterceptor)
      .useValue(mockSentryInterceptor)
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
