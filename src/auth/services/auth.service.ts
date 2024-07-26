import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwitterApi } from 'twitter-api-v2';
import {
  VerifiedTokenPayload,
  VerifyAuthRequest,
  VerifyAuthRequestDto,
  VerifyAuthResponse,
} from '../dto/verify-auth.dto';
import {
  AuthoriseUserResponse,
  ConnectSocialMediaRequest,
  LoginRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterUserRequest,
  TweetRequest,
} from '../dto/create-user-request.dto';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../entities/user.entity';
import { verifyHashedPassword } from '@common/utils/hash-password';
import { Errors } from '@common/Error.messages';
import { LoggerService } from '@common/logger/logger.service';
import { UserRoles } from '@/common/enums/user-role.enums';
import { MicroserviceEnvKeys } from '@/microserviceFactory.factory';
import { UniqueIdGenetrator } from '@/common/utils/unique-id.generator';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UserRepository } from '../repositories/user.repositories';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { UserProfileRepository } from '../repositories/user-profile.repositories';
import { Types } from 'mongoose';
import { UserProfileEntity } from '../entities/user-profile.entity';  
import { Request, Response } from 'express';
import TwitterApiBase from 'twitter-api-v2/dist/esm/client.base';
import { StringToObjectId } from '@/common/utils/utils';
import { handleException } from '@/common/exceptions/http_exception_thrower';
import { ConnectedAccountsRepository } from '../repositories/connected-accounts.repository';
import { ConnectedAccountsEntity, SocialMedia } from '../entities/connected-accounts.entity';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { AuthorizationCode } from 'simple-oauth2';
import axios from 'axios';
import { BaseRequest } from '@/common/base.request';

@Injectable()
export class AuthService {
  private JWT_REFRESH_TOKEN_SECRET: string = '';
  private JWT_TOKEN_SECRET: string = '';
  private googleInClient: AuthorizationCode;
  private linkedInClient: AuthorizationCode;
  private facebookClient: AuthorizationCode;
  private instagramClient: AuthorizationCode;
  constructor(
    private configService: ConfigService,
    private jwt: JwtService,
    private loggerService: LoggerService,
    private userRepo: UserRepository,
    private userProfileRepo: UserProfileRepository, 
    private readonly connectedAccountsRepository: ConnectedAccountsRepository,

    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {
    this.JWT_REFRESH_TOKEN_SECRET = configService.getOrThrow(MicroserviceEnvKeys.JWT_REFRESH_SECRET);
    this.JWT_TOKEN_SECRET = configService.getOrThrow(MicroserviceEnvKeys.JWT_SECRET);

    const linkedInClientId = this.configService.getOrThrow('LINKEDIN_CLIENT_ID');
    const linkedInClientSecret = this.configService.getOrThrow('LINKEDIN_SECONDARY_CLIENT_SECRET');

    this.linkedInClient = new AuthorizationCode({
      client: {
        id: linkedInClientId,
        secret: linkedInClientSecret,
        idParamName: 'client_id',
        secretParamName: 'client_secret',
      },
      auth: {
        tokenHost: 'https://www.linkedin.com',
        authorizePath: '/oauth/v2/authorization',
        tokenPath: '/oauth/v2/accessToken',
      },
    });

    const facebookClientId = this.configService.getOrThrow('FACEBOOK_CLIENT_ID');
    const facebookClientSecret = this.configService.getOrThrow('FACEBOOK_CLIENT_SECRET');

    this.facebookClient = new AuthorizationCode({
      client: {
        id: facebookClientId,
        secret: facebookClientSecret,
        idParamName: 'client_id',
        secretParamName: 'client_secret',
      },
      auth: {
        tokenHost: 'https://graph.facebook.com',
        authorizePath: '/oauth',
        tokenPath: '/v20.0/oauth/access_token',
      },
    });

    // const instagramClientId = this.configService.getOrThrow('INSTAGRAM_CLIENT_ID');
    // const instagramClientSecret = this.configService.getOrThrow('INSTAGRAM_CLIENT_SECRET');

    // this.instagramClient = new AuthorizationCode({
    //   client: {
    //     id: instagramClientId,
    //     secret: instagramClientSecret,
    //     idParamName: 'client_id',
    //     secretParamName: 'client_secret',
    //   },
    //   auth: {
    //     tokenHost: 'https://api.instagram.com',
    //     authorizePath: '/oauth/authorize',
    //     tokenPath: '/oauth/access_token',
    //   },
    // });
  }

  public async register(registerUserRequest: RegisterUserRequest): Promise<AuthoriseUserResponse> {
    try {
      let isUserExisting = await this.userRepo.findByEmail(registerUserRequest.email);

      if (isUserExisting) {
        throw new BadRequestException(Errors.USER_ALREADY_EXISTS);
      }

      isUserExisting = await this.userRepo.findByUserName(registerUserRequest.userName);

      if (isUserExisting) {
        throw new BadRequestException(Errors.USER_NAME_ALREADY_EXISTS);
      }

      let profile = UserProfileEntity.builder()
        .setphoneNumber(registerUserRequest.phoneNumber)
        .setlocation(registerUserRequest.location ?? null)
        .setwebsite(registerUserRequest.website ?? null)
        .build();
      profile = await this.userProfileRepo.create(profile);
  

      let user = UserEntity.builder()
        .setEmail(registerUserRequest.email)
        .setPassword(registerUserRequest.password)
        .setUserName(registerUserRequest.userName)
        .setFirstName(registerUserRequest.firstName)
        .setLastName(registerUserRequest.lastName)
        .setUserProfile(profile) 
        .build();

      this.loggerService.log('AUTH-SERVICE.register()', `${user.email} successfully created the account!`);
      user = await this.userRepo.create(user);

      if (!user) {
        throw new BadGatewayException(Errors.UNABLE_TO_CREATE);
      }
      const sessionId = UniqueIdGenetrator.gernerate();
      const token = await this.generateToken({
        email: user._id.toString(),
        id: user.email,
        sessionId,
      });
      const refreshToken = await this.generateRefreshToken(user._id.toString(), sessionId);

      /**
       * Build refresh token instance
       */
      const refreshTokenEntity = RefreshTokenEntity.builder()
        .setSessionId(sessionId)
        .setUser(user)
        .setToken(refreshToken)
        .setExpiryDate(this.calculateExpiryDate())
        .build();

      /**
       * save refresh token
       */
      await this.refreshTokenRepository.create(refreshTokenEntity);

      return AuthoriseUserResponse.of(
        user._id.toString(),
        user.email,
        false,
        token,
        refreshToken,
      );
    } catch (error) {
      console.log(error);
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof BadGatewayException) {
        throw new BadGatewayException(error.message);
      }
      throw new InternalServerErrorException(Errors.UNABLE_TO_CREATE);
    }
  }
  public async login(loginUserRequest: LoginRequest): Promise<AuthoriseUserResponse> {
    try {
      const user = await this.userRepo.findByEmail(loginUserRequest.email);

      if (!user) {
        throw new BadRequestException(Errors.USER_NOT_FOUND);
      }

      const isPasswordVerified = await verifyHashedPassword(loginUserRequest.password, user.password);
      if (!isPasswordVerified) {
        throw new BadRequestException(Errors.INVALID_CREDENTIALS);
      }
 

      const isInWaitingList =   false;

      if (isInWaitingList) {
        return AuthoriseUserResponse.of(user._id, user.email, isInWaitingList);
      }

      const sessionId = UniqueIdGenetrator.gernerate();
      const token = await this.generateToken({
        email: user.email,
        id: user._id.toString(),
        sessionId,
      });

      this.loggerService.log('AUTH-SERVICE.login()', `${user.email} successfully logged in`);

      const existingRefreshToken = await this.refreshTokenRepository.findByUserId(user._id);
      if (existingRefreshToken.length >= 0) {
        await this.refreshTokenRepository.remove(existingRefreshToken);
      }

      const newRefreshToken = await this.generateRefreshToken(user._id, sessionId);

      const refreshTokenEntity = RefreshTokenEntity.builder()
        .setSessionId(sessionId)
        .setUser(user)
        .setToken(newRefreshToken)
        .setExpiryDate(this.calculateExpiryDate())
        .build();

      await this.refreshTokenRepository.create(refreshTokenEntity);
      return AuthoriseUserResponse.of(user._id, user.email, false, token, newRefreshToken);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      console.log(error);
      throw new InternalServerErrorException(Errors.UNABLE_TO_LOGIN);
    }
  }

  public async refresh(refreshTokenRequest: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const { refreshToken } = refreshTokenRequest;
      const { sessionId } = await this.decodeToken(refreshToken, this.JWT_REFRESH_TOKEN_SECRET);

      let existingRefreshToken = await this.refreshTokenRepository.findByTokenAndSessionId(refreshToken, sessionId);

      if (!existingRefreshToken || existingRefreshToken.expiryDate < new Date(Date.now())) {
        throw new UnauthorizedException(Errors.INVALID_REFRESH_TOKEN);
      }

      const user = await this.userRepo.findById(existingRefreshToken.user._id);

      if (!user) {
        throw new UnauthorizedException(Errors.INVALID_REFRESH_TOKEN);
      }

      const accessToken = await this.generateToken({
        email: user._id.toString(),
        id: user.email,
        sessionId,
      });

      const newRefreshToken = await this.generateRefreshToken(user._id, sessionId);

      existingRefreshToken = existingRefreshToken
        .toBuilder()
        .setExpiryDate(this.calculateExpiryDate())
        .setUser(user)
        .setSessionId(sessionId)
        .setToken(newRefreshToken)
        .build();

      existingRefreshToken = await this.refreshTokenRepository.create(existingRefreshToken);

      return RefreshTokenResponse.of(newRefreshToken, accessToken);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }

      Logger.error('' + error);
      throw new InternalServerErrorException(Errors.UNABLE_TO_GENERATE_REFRESH_TOKEN);
    }
  }
  async verify(verifyAuthRequest: VerifyAuthRequest): Promise<VerifyAuthResponse> {
    try {
      // const { token } = verifyAuthRequest;
      const requestDto = new VerifyAuthRequestDto(verifyAuthRequest);
      console.log(requestDto);
      // const tokenType = requestDto.getType();
      const token = requestDto.getToken();
      console.log(token);
      // const decodedToken = await this.decodeToken(token);
      const decodedToken = await this.decodeToken(token, this.JWT_TOKEN_SECRET);
      console.log('decodedToken', decodedToken);
      const { email } = decodedToken;
      // Check if the email exists in the database
      console.log('email', email);
      const user = await this.userRepo.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException(Errors.UN_AUTHORISED);
      }
      console.log(user);

      const isValid = true;
      this.loggerService.log('AUTH-SERVICE.verify()', `${user.email} successfully verified to access api !`);

      return VerifyAuthResponse.of(user._id, user.email, isValid);
    } catch (error) {
      if (error instanceof Error) {
        this.loggerService.error('AUTH-SERVICE.verify()', `${error.message}`);
      } else {
        this.loggerService.error('AUTH-SERVICE.verify()', `${error}`);
      }

      throw new UnauthorizedException(Errors.UN_AUTHORISED);
    }
  }

  async generateToken(payload: object | Buffer, neverExpire = false): Promise<string> {
    const options: Record<string, any> = {
      secret: this.JWT_TOKEN_SECRET,
    };

    if (!neverExpire) {
      options.expiresIn = '2h';
    }

    return await this.jwt.signAsync(payload, options);
  }
  async generateRefreshToken(userId: string | Types.ObjectId, sessionId: string): Promise<string> {
    const refreshToken = await this.jwt.signAsync(
      { userId, sessionId },
      { secret: this.JWT_REFRESH_TOKEN_SECRET, expiresIn: '7d' },
    );
    return refreshToken;
  }
  calculateExpiryDate(): Date {
    const daysTillExpire = 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysTillExpire);

    return expiryDate;
  }

  async decodeToken(token: string, secret: string): Promise<VerifiedTokenPayload> {
    try {
      return await this.jwt.verifyAsync(token, { secret: secret });
    } catch (error) {
      console.log('Error: ', error);
    }
  }

  async _getUserRoles(getUserRoleFromTokenRequest: VerifyAuthResponse): Promise<UserRoles> {
    try {
      const user = await this.userRepo.findById(new Types.ObjectId(getUserRoleFromTokenRequest.userId));
      return user.role;
    } catch (error) {
      return null;
    }
  }

  public async generateTokenForServerAccess(loginUserRequest: LoginRequest) {
    try {
      const user = await this.userRepo.findByEmail(loginUserRequest.email);

      if (!user) {
        throw new BadRequestException(Errors.USER_NOT_FOUND);
      } 

      const isPasswordVerified = await verifyHashedPassword(loginUserRequest.password, user.password);
      if (!isPasswordVerified) {
        throw new BadRequestException(Errors.INVALID_CREDENTIALS);
      }

      const isInWaitingList =   false;

      if (isInWaitingList) {
        return AuthoriseUserResponse.of(user._id, user.email, isInWaitingList);
      }

      const sessionId = UniqueIdGenetrator.gernerate();
      const payload = {
        serverAccess: true,
        email: user.email,
        id: user._id.toString(),
        sessionId: sessionId,
      };
      const token = await this.generateToken(payload, true);
      return AuthoriseUserResponse.of(user._id, user.email, false, token);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      console.log(error);
      throw new BadRequestException(error);
    }
  }

  public async generateTwitterLink(
    req: Request,
    res: Response,
    session: Record<string, any>,
    connectSocialMediaRequest: ConnectSocialMediaRequest,
  ): Promise<any> {
    try {
      if (Types.ObjectId.isValid(connectSocialMediaRequest.userId) === false) throw new UnauthorizedException();
      const user = await this.userRepo.findById(StringToObjectId(connectSocialMediaRequest.userId));

      if (!user) throw new UnauthorizedException();

      const connectedAccounts = await this.connectedAccountsRepository.findByUserIdSocialMedia(
        StringToObjectId(connectSocialMediaRequest.userId),
        SocialMedia.TWITTER,
      );
      console.log(connectedAccounts, 'connectedAccounts');
      if (connectedAccounts) throw new BadRequestException(Errors.ALREADY_CONNECTED);

      const appKey = this.configService.getOrThrow('TWITTER_CONSUMER_KEY');
      const appSecret = this.configService.getOrThrow('TWITTER_CONSUMER_SECRET');
      const cbUrl = this.configService.getOrThrow('TWITTER_CALLBACK_URL');

      const client = new TwitterApi({
        // clientId:'TEoxNUUxQkxta2tVT0VwTlRIQmQ6MTpjaQ',
        appKey: appKey,
        appSecret: appSecret,
        // clientSecret:'ZFqRymVhiwRTYwqitZpxXzgs6zoS0kiQ_TvvB4i74cl1Pf6A8R',
      });

      const authLink = await client.generateAuthLink(cbUrl, { linkMode: 'authorize' });
      session.oauth_token_secret = authLink.oauth_token_secret;
      session.userId = connectSocialMediaRequest.userId;
      return res.redirect(authLink.url);
    } catch (error) {
      throw handleException(error);
    }
  }

  public async twitterCallback(req: Request, res: Response, session: Record<string, any>): Promise<any> {
    const redirectUrl = this.configService.getOrThrow(MicroserviceEnvKeys.CLIENT_BASE_URL) + '/dashboard/account';

    try {
      const { oauth_token, oauth_verifier } = req.query;
      // Get the saved oauth_token_secret from session
      const { oauth_token_secret } = session;
      console.log(oauth_token, oauth_verifier, oauth_token_secret);

      if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
        throw new BadRequestException('You denied the app or your session expired!');
      }

      const user = await this.userRepo.findById(StringToObjectId(session.userId));
      if (!user) throw new UnauthorizedException();

      // return null

      // return {
      //   accessToken: oauth_token,
      //   accessSecret: oauth_token_secret,
      //   user: oauth_verifier
      // }

      // Obtain the persistent tokens
      // Create a client from temporary tokens
      const client = new TwitterApi({
        appKey: this.configService.getOrThrow('TWITTER_CONSUMER_KEY'),
        appSecret: this.configService.getOrThrow('TWITTER_CONSUMER_SECRET'),
        accessToken: oauth_token,
        accessSecret: oauth_token_secret,
      } as unknown as TwitterApiBase);

      await client
        .login(oauth_verifier as string)
        .then(async ({ client: loggedClient, accessToken, accessSecret }) => {
          const u = await loggedClient.currentUserV2();
          const connectedAccountEntity = ConnectedAccountsEntity.builder()
            .setUser(user)
            .setSocialMedia(SocialMedia.TWITTER)
            .setUserName(u.data.username)
            .setAccessToken(accessToken)
            .setAccessSecret(accessSecret)
            .build();

          await this.connectedAccountsRepository.create(connectedAccountEntity);
          return {
            accessToken,
            accessSecret,
            user: loggedClient,
          };
          // loggedClient is an authenticated client in behalf of some user
          // Store accessToken & accessSecret somewhere
        })
        .catch(() => null);

      return res.redirect(redirectUrl);
    } catch (error) {
      return res.redirect(redirectUrl + '?error=401');

      // throw handleException(error)
    }
  }

  public async tweet(req: TweetRequest) {
    const connectedTwitterAccounts = await this.connectedAccountsRepository.findByUserIdSocialMedia(
      StringToObjectId('665eee0ecb7c1400152abedc'),
      SocialMedia.TWITTER,
    );

    if (!connectedTwitterAccounts) throw new UnauthorizedException();
    const client = new TwitterApi({
      appKey: this.configService.getOrThrow('TWITTER_CONSUMER_KEY'),
      appSecret: this.configService.getOrThrow('TWITTER_CONSUMER_SECRET'),
      accessToken: connectedTwitterAccounts.accessToken,
      accessSecret: connectedTwitterAccounts.accessSecret,
    } as unknown as TwitterApiBase);

    // const { data: createdTweet } = await client.v2.tweet('Select of two below options!', {
    //   poll: { duration_minutes: 120, options: ['Absolutely', 'For sure!'], },
    // });
    const { data: createdTweet } = await client.v2.tweet(req.tweet);

    return createdTweet;
  }

  public async validateTwitterUser(...s: any) {
    console.log('s', s);
    return {
      isValid: true,
    };
  }

  public async generateGoogleLink(
    req: Request,
    res: Response,
    session: Record<string, any>,
    connectSocialMediaRequest: ConnectSocialMediaRequest,
  ): Promise<any> {
    try {
      if (Types.ObjectId.isValid(connectSocialMediaRequest.userId) === false) throw new UnauthorizedException();
      const user = await this.userRepo.findById(connectSocialMediaRequest.userId);

      if (!user) throw new UnauthorizedException();

      const connectedAccounts = await this.connectedAccountsRepository.findByUserIdSocialMedia(
        connectSocialMediaRequest.userId,
        SocialMedia.GOOGLE,
      );
      if (connectedAccounts) throw new BadRequestException(Errors.ALREADY_CONNECTED);

      const clientId = this.configService.getOrThrow('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.getOrThrow('GOOGLE_CLIENT_SECRET');
      const redirectUri = this.configService.getOrThrow('GOOGLE_CALLBACK_URL');

      const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

      const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.events.readonly',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
      });

      session.userId = connectSocialMediaRequest.userId;
      return res.redirect(authUrl);
    } catch (error) {
      throw handleException(error);
    }
  }

  public async googleCallback(req: Request, res: Response, session: Record<string, any>): Promise<any> {
    const redirectUrl = this.configService.getOrThrow('CLIENT_BASE_URL') + '/dashboard/account';

    try {
      const { code } = req.query;

      if (!code) {
        throw new BadRequestException('You denied the app or your session expired!');
      }

      const user = await this.userRepo.findById(StringToObjectId(session.userId));
      if (!user) throw new UnauthorizedException();

      const clientId = this.configService.getOrThrow('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.getOrThrow('GOOGLE_CLIENT_SECRET');
      const redirectUri = this.configService.getOrThrow('GOOGLE_CALLBACK_URL');

      const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2',
      });

      const userInfo = await oauth2.userinfo.get();

      const connectedAccountEntity = ConnectedAccountsEntity.builder()
        .setUser(user)
        .setSocialMedia(SocialMedia.GOOGLE)
        .setUserName(userInfo.data.name)
        .setAccessToken(tokens.access_token)
        .setRefreshToken(tokens.refresh_token)
        .setIdToken(tokens.id_token)
        .build();

      await this.connectedAccountsRepository.create(connectedAccountEntity);

      return res.redirect(redirectUrl);
    } catch (error) {
      return res.redirect(redirectUrl + '?error=401');
    }
  }

  public async googleDisconnect(disconnectRequest: BaseRequest) {
    try {
      const connectedAccount = await this.connectedAccountsRepository.findByUserIdSocialMedia(
        disconnectRequest.authInfo.userId,
        SocialMedia.GOOGLE,
      );

      if (!connectedAccount) {
        throw new BadRequestException('No connected Google account found.');
      }

      const clientId = this.configService.getOrThrow('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.getOrThrow('GOOGLE_CLIENT_SECRET');
      const redirectUri = this.configService.getOrThrow('GOOGLE_CALLBACK_URL');

      const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

      if (connectedAccount.refreshToken) {
        await oauth2Client.revokeToken(connectedAccount.refreshToken);
      } else if (connectedAccount.accessToken) {
        await oauth2Client.revokeToken(connectedAccount.accessToken);
      }

      await this.connectedAccountsRepository.remove(connectedAccount._id);

      return 'Google account disconnected successfully.';
    } catch (error) {
      handleException(error);
    }
  }

  public async generateLinkedInLink(
    req: Request,
    res: Response,
    session: Record<string, any>,
    connectSocialMediaRequest: ConnectSocialMediaRequest,
  ): Promise<any> {
    try {
      const { userId } = connectSocialMediaRequest;

      if (!Types.ObjectId.isValid(userId)) throw new UnauthorizedException('Invalid user ID');

      const user = await this.userRepo.findById(userId);
      if (!user) throw new UnauthorizedException('User not found');

      const connectedAccounts = await this.connectedAccountsRepository.findByUserIdSocialMedia(
        userId,
        SocialMedia.LINKEDIN,
      );
      if (connectedAccounts) throw new BadRequestException('LinkedIn account already connected');

      const authorizationUri = this.linkedInClient.authorizeURL({
        redirect_uri: this.configService.getOrThrow('LINKEDIN_CALLBACK_URL'),
        scope: 'openid profile w_member_social email',
        state: userId,
      });

      session.userId = userId;
      return res.redirect(authorizationUri);
    } catch (error) {
      throw handleException(error);
    }
  }

  public async linkedInCallback(req: Request, res: Response, session: Record<string, any>): Promise<any> {
    const redirectUrl = this.configService.getOrThrow('CLIENT_BASE_URL') + '/dashboard/account';

    try {
      const { code } = req.query;

      console.log('====================================');
      console.log('code', code);
      console.log('====================================');

      if (!code) throw new BadRequestException('Authorization code not found');

      const userId = session.userId;

      console.log('====================================');
      console.log('userId', userId);
      console.log('====================================');
      if (!userId) throw new UnauthorizedException('Session expired or invalid');

      const user = await this.userRepo.findById(String(userId));
      if (!user) throw new UnauthorizedException('User not found');

      // const tokenParams: AuthorizationTokenConfig = {
      //   code: code as string,
      //   redirect_uri: this.configService.getOrThrow('LINKEDIN_CALLBACK_URL'),
      //   scope: 'openid profile w_member_social email',
      // };

      const tokenEndpoint = 'https://www.linkedin.com/oauth/v2/accessToken';
      const linkedInClientId = this.configService.getOrThrow('LINKEDIN_CLIENT_ID');
      const linkedInClientSecret = this.configService.getOrThrow('LINKEDIN_SECONDARY_CLIENT_SECRET');

      // const accessToken = await this.linkedInClient.getToken(tokenParams);

      const data = {
        grant_type: 'authorization_code',
        code: code as string,
        client_id: linkedInClientId,
        client_secret: linkedInClientSecret,
        redirect_uri: this.configService.getOrThrow('LINKEDIN_CALLBACK_URL'),
      };

      const response = await axios.post(tokenEndpoint, new URLSearchParams(data), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('====================================');
      console.log('response', response);
      console.log('====================================');

      const accessToken = response.data.access_token;

      console.log('====================================');
      console.log('accessToken', accessToken);
      console.log('====================================');

      const userInfoUrl = 'https://api.linkedin.com/v2/me';
      const emailInfoUrl = 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))';

      const userInfoResponse = await axios.get(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const userInfo = await userInfoResponse.data;

      console.log('====================================');
      console.log('userInfo', userInfo);
      console.log('====================================');

      const emailInfoResponse = await axios.get(emailInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const emailInfo = await emailInfoResponse.data;

      console.log('====================================');
      console.log('emailInfo', emailInfo);
      console.log('====================================');

      const connectedAccountEntity = ConnectedAccountsEntity.builder()
        .setUser(user)
        .setSocialMedia(SocialMedia.LINKEDIN)
        .setUserName(userInfo.localizedFirstName + ' ' + userInfo.localizedLastName)
        .setAccessToken(accessToken.token.access_token as string)
        .setRefreshToken(accessToken.token.refresh_token as string)
        .setIdToken(accessToken.token.id_token as string)
        .setEmail(emailInfo.elements[0]['handle~'].emailAddress)
        .build();

      await this.connectedAccountsRepository.create(connectedAccountEntity);

      return res.redirect(redirectUrl);
    } catch (error) {
      console.log('====================================');
      console.log('error', error);
      console.log('====================================');
      return res.redirect(`${redirectUrl}?error=401`);
    }
  }

  public async generateFacebookLink(
    req: Request,
    res: Response,
    session: Record<string, any>,
    connectSocialMediaRequest: ConnectSocialMediaRequest,
  ): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(connectSocialMediaRequest.userId)) throw new UnauthorizedException();
      const user = await this.userRepo.findById(connectSocialMediaRequest.userId);

      if (!user) throw new UnauthorizedException();

      const connectedAccounts = await this.connectedAccountsRepository.findByUserIdSocialMedia(
        connectSocialMediaRequest.userId,
        SocialMedia.FACEBOOK,
      );

      if (connectedAccounts) throw new BadRequestException('Account already connected');

      const redirectUri = this.configService.getOrThrow('FACEBOOK_CALLBACK_URL');

      console.log('==================================== redirectUri');
      console.log(redirectUri);
      console.log('====================================');

      const scopes = [
        'email',
        'public_profile',
        // 'pages_show_list',
        //'pages_read_engagement'
      ];

      const authorizationUri = this.facebookClient.authorizeURL({
        redirect_uri: redirectUri,
        scope: scopes.join(','),
      });

      console.log('==================================== authorizationUri');
      console.log(authorizationUri);
      console.log('====================================');

      session.userId = connectSocialMediaRequest.userId;
      return res.redirect(authorizationUri);
    } catch (error) {
      throw handleException(error);
    }
  }

  public async facebookCallback(req: Request, res: Response, session: Record<string, any>): Promise<any> {
    const redirectUrl = this.configService.getOrThrow('CLIENT_BASE_URL') + '/dashboard/account';

    try {
      const { code } = req.query;

      if (!code) {
        throw new BadRequestException('You denied the app or your session expired!');
      }

      const user = await this.userRepo.findById(StringToObjectId(session.userId));
      if (!user) throw new UnauthorizedException();

      const clientId = this.configService.getOrThrow('FACEBOOK_CLIENT_ID');
      const clientSecret = this.configService.getOrThrow('FACEBOOK_CLIENT_SECRET');
      const redirectUri = this.configService.getOrThrow('FACEBOOK_CALLBACK_URL');

      const tokenUrl = `https://graph.facebook.com/v11.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`;

      const response = await fetch(tokenUrl);
      const tokens = await response.json();

      if (tokens.error) {
        throw new BadRequestException('Failed to get access token');
      }

      const userInfoUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${tokens.access_token}`;
      const userInfoResponse = await fetch(userInfoUrl);
      const userInfo = await userInfoResponse.json();

      const connectedAccountEntity = ConnectedAccountsEntity.builder()
        .setUser(user)
        .setSocialMedia(SocialMedia.FACEBOOK)
        .setUserName(userInfo.name)
        .setAccessToken(tokens.access_token)
        .build();

      await this.connectedAccountsRepository.create(connectedAccountEntity);

      return res.redirect(redirectUrl);
    } catch (error) {
      return res.redirect(redirectUrl + '?error=401');
    }
  }

  public async generateInstagramLink(
    req: Request,
    res: Response,
    session: Record<string, any>,
    connectSocialMediaRequest: ConnectSocialMediaRequest,
  ): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(connectSocialMediaRequest.userId)) throw new UnauthorizedException();
      const user = await this.userRepo.findById(connectSocialMediaRequest.userId);

      if (!user) throw new UnauthorizedException();

      const connectedAccounts = await this.connectedAccountsRepository.findByUserIdSocialMedia(
        connectSocialMediaRequest.userId,
        SocialMedia.INSTAGRAM,
      );
      if (connectedAccounts) throw new BadRequestException('Account already connected');

      const clientId = this.configService.getOrThrow('INSTAGRAM_CLIENT_ID');
      const redirectUri = this.configService.getOrThrow('INSTAGRAM_CALLBACK_URL');

      const scopes = ['user_profile', 'user_media'];

      const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(',')}&response_type=code`;

      session.userId = connectSocialMediaRequest.userId;
      return res.redirect(authUrl);
    } catch (error) {
      throw handleException(error);
    }
  }

  public async instagramCallback(req: Request, res: Response, session: Record<string, any>): Promise<any> {
    const redirectUrl = this.configService.getOrThrow('CLIENT_BASE_URL') + '/dashboard/account';

    try {
      const { code } = req.query;

      if (!code) {
        throw new BadRequestException('You denied the app or your session expired!');
      }

      const user = await this.userRepo.findById(StringToObjectId(session.userId));
      if (!user) throw new UnauthorizedException();

      const clientId = this.configService.getOrThrow('INSTAGRAM_CLIENT_ID');
      const clientSecret = this.configService.getOrThrow('INSTAGRAM_CLIENT_SECRET');
      const redirectUri = this.configService.getOrThrow('INSTAGRAM_CALLBACK_URL');

      const tokenUrl = `https://api.instagram.com/oauth/access_token`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: code as string,
        }).toString(),
      });

      const tokens = await response.json();

      if (tokens.error) {
        throw new BadRequestException('Failed to get access token');
      }

      const userInfoUrl = `https://graph.instagram.com/me?fields=id,username&access_token=${tokens.access_token}`;
      const userInfoResponse = await fetch(userInfoUrl);
      const userInfo = await userInfoResponse.json();

      const connectedAccountEntity = ConnectedAccountsEntity.builder()
        .setUser(user)
        .setSocialMedia(SocialMedia.INSTAGRAM)
        .setUserName(userInfo.username)
        .setAccessToken(tokens.access_token)
        .build();

      await this.connectedAccountsRepository.create(connectedAccountEntity);

      return res.redirect(redirectUrl);
    } catch (error) {
      return res.redirect(redirectUrl + '?error=401');
    }
  }
}
