import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@common/logger/logger.service';
import { UserRepository } from '../repositories/user.repositories';
import { UserProfileRepository } from '../repositories/user-profile.repositories';
import { ConnectedAccountsRepository } from '../repositories/connected-accounts.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { BadRequestException } from '@nestjs/common';
import { Errors } from '@common/Error.messages';
import { UserRoles } from '@/common/enums/user-role.enums';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: UserRepository;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_SECRET') return 'access-secret';
      return 'mock-value';
    }),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
    verifyAsync: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  const mockRepo = () => ({
    findByEmail: jest.fn(),
    findByUserName: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn().mockResolvedValue([]),
    remove: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: UserRepository, useFactory: mockRepo },
        { provide: UserProfileRepository, useFactory: mockRepo },
        { provide: ConnectedAccountsRepository, useFactory: mockRepo },
        { provide: RefreshTokenRepository, useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw BadRequestException if user not found', async () => {
      jest.spyOn(userRepo, 'findByEmail').mockResolvedValue(null);

      await expect(service.login({
        email: 'none@test.com', password: 'password',
        roles: UserRoles.ADMIN
      }))
        .rejects
        .toThrow(new BadRequestException(Errors.USER_NOT_FOUND));
    });
  });
});
