import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../dto/create-user-request.dto';
import { AuthoriseUserResponse } from '../dto/create-user-request.dto';
import { UserRoles } from '@/common/enums/user-role.enums';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password',
        roles: UserRoles.ADMIN
      };
      
      const expectedResponse = AuthoriseUserResponse.of('id', 'test@example.com', false, 'token', 'refresh');
      jest.spyOn(service, 'login').mockResolvedValue(expectedResponse);

      const result = await controller.login(loginRequest);

      expect(service.login).toHaveBeenCalledWith(loginRequest);
      expect(result).toEqual(expectedResponse);
    });
  });
});
