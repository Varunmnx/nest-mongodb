import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './repositories/user.repositories';
import { UserProfileRepository } from './repositories/user-profile.repositories';
import { ConnectedAccountsRepository } from './repositories/connected-accounts.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { of } from 'rxjs';

describe('UserService', () => {
  let service: UserService;

  const mockHttpService = {
    get: jest.fn().mockReturnValue(of({ data: {} })),
    post: jest.fn().mockReturnValue(of({ data: {} })),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('mock-value'),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
    verifyAsync: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
  };

  const mockRepo = () => ({
    findById: jest.fn(),
    findAll: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
    findByUserId: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserRepository, useFactory: mockRepo },
        { provide: UserProfileRepository, useFactory: mockRepo },
        { provide: ConnectedAccountsRepository, useFactory: mockRepo },
        { provide: RefreshTokenRepository, useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
