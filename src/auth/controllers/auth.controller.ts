import { Body, Controller, Get, Post, Query, Req, Res, Session, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {
  AuthoriseUserResponse,
  ConnectSocialMediaRequest,
  LoginRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterUserRequest,
  TweetRequest,
} from '../dto/create-user-request.dto';
import { SentryInterceptor } from '@common/interceptors/sentry.interceptor';
import { ApiBasicAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthInfo, BaseRequest } from '@common/base.request';
import { AuthGuard } from '@common/guards/guards';
import { UserRoles } from '@/common/enums/user-role.enums';
import { Roles } from '@/common/decorators/roles.decorator';
import { Request, Response } from 'express';

@UseInterceptors(SentryInterceptor)
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ description: 'Login Response', type: AuthoriseUserResponse })
  async login(@Body() loginUserRequest: LoginRequest): Promise<AuthoriseUserResponse> {
    return await this.authService.login(loginUserRequest);
  }

  @Post('register')
  @ApiOkResponse({ description: 'Register Response', type: AuthoriseUserResponse })
  async register(@Body() registerUserRequest: RegisterUserRequest): Promise<AuthoriseUserResponse> {
    return await this.authService.register(registerUserRequest);
  }

  @Post('refresh')
  @ApiOkResponse({ description: 'Refresh token Response', type: RefreshTokenResponse })
  async refresh(@Body() refreshTokenRequest: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return await this.authService.refresh(refreshTokenRequest);
  }
  /**
   * Initiates the Twitter OAuth flow.
   *
   * @param {Req} req - The request object.
   * @return {Promise<void>} A promise that resolves when the Twitter OAuth flow is initiated.
   */
  @Get('twitter')
  // @UseGuards(PassportAuthGuard('twitter'))
  async twitterAuth(
    @Query() connectSocialMediaRequest: ConnectSocialMediaRequest,
    @Req() req: Request,
    @Res() res: Response,
    @Session() session: Record<string, any>,
  ) {
    console.log(req.session);

    return this.authService.generateTwitterLink(req, res, session, connectSocialMediaRequest);
    // Initiates the Twitter OAuth flow
  }

  @Get('twitter/callback')
  async twitterCallback(@Req() req: Request, @Res() res: Response, @Session() session: Record<string, any>) {
    return await this.authService.twitterCallback(req, res, session);
  }

  @Post('twitter/tweet')
  @UseGuards(AuthGuard)
  @ApiBasicAuth(AuthInfo.JWT_AUTH_KEY)
  async tweet(@Body() req: TweetRequest) {
    return await this.authService.tweet(req);
  }

  @Get('google')
  async googleAuth(
    @Query() connectSocialMediaRequest: ConnectSocialMediaRequest,
    @Req() req: Request,
    @Res() res: Response,
    @Session() session: Record<string, any>,
  ) {
    console.log(req.session);

    return this.authService.generateGoogleLink(req, res, session, connectSocialMediaRequest);
  }

  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response, @Session() session: Record<string, any>) {
    return await this.authService.googleCallback(req, res, session);
  }

  @Get('google/disconnect')
  @UseGuards(AuthGuard)
  @ApiBasicAuth(AuthInfo.JWT_AUTH_KEY)
  async googleDisconnect(@Query() disconnectRequest: BaseRequest) {
    return await this.authService.googleDisconnect(disconnectRequest);
  }

  // @Get('linkedin')
  // async linkedInAuth(
  //   @Query() connectSocialMediaRequest: ConnectSocialMediaRequest,
  //   @Req() req: Request,
  //   @Res() res: Response,
  //   @Session() session: Record<string, any>,
  // ) {
  //   console.log(req.session);

  //   return this.authService.generateLinkedInLink(req, res, session, connectSocialMediaRequest);
  // }

  // @Get('linkedin/callback')
  // async linkedInCallback(@Req() req: Request, @Res() res: Response, @Session() session: Record<string, any>) {
  //   return await this.authService.linkedInCallback(req, res, session);
  // }

  // @Get('facebook')
  // async facebookAuth(
  //   @Query() connectSocialMediaRequest: ConnectSocialMediaRequest,
  //   @Req() req: Request,
  //   @Res() res: Response,
  //   @Session() session: Record<string, any>,
  // ) {
  //   console.log(req.session);

  //   return this.authService.generateFacebookLink(req, res, session, connectSocialMediaRequest);
  // }

  // @Get('facebook/callback')
  // async facebookCallback(@Req() req: Request, @Res() res: Response, @Session() session: Record<string, any>) {
  //   return await this.authService.facebookCallback(req, res, session);
  // }

  // @Get('users/role')
  // @ApiOkResponse({ description: 'users Response', type: AuthoriseUserResponse })
  // async users(@Query() request: GetUserByRoleRequest): Promise<GetUsersByRoleResponse> {
  //   return await this.authService.getUsersByRole(request);
  // }

  @Post('server-login')
  async serverLogin(@Body() serverLoginRequest: LoginRequest): Promise<AuthoriseUserResponse> {
    return await this.authService.generateTokenForServerAccess(serverLoginRequest);
  }

  @Get('test')
  @UseGuards(AuthGuard)
  @ApiBasicAuth(AuthInfo.JWT_AUTH_KEY)
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  test(@Query() req: BaseRequest) {
    console.log(req.roles);
    return 'Ok';
  }
}
