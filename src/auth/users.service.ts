import { MicroserviceEnvKeys } from '@/microserviceFactory.factory';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
// import { UserRolesRepository } from './repositories/user-role.repositories';
import { UserRepository } from './repositories/user.repositories';
import { BaseRequest } from '@/common/base.request';
import {
  ActivateAccountRequest,
  FindUsersResponse,
  // UnlinkSocialMediaRequest,
  UpdateUserRequest,
  UpdateWaitingListRequest,
} from './dto/create-user-request.dto';
// import { UserStateRepository } from './repositories/user-state.repositories';
import { UserProfileRepository } from './repositories/user-profile.repositories';
import { handleException } from '@/common/exceptions/http_exception_thrower';
import { Errors } from '@/common/Error.messages'; 
import { ConnectedAccountsRepository } from './repositories/connected-accounts.repository';
import { SocialMedia } from './entities/connected-accounts.entity';
import { ConnectedAccountsResponse } from './dto/get-users-request.dto'; 

@Injectable()
export class UserService {
  private JWT_REFRESH_TOKEN_SECRET: string = '';
  private JWT_TOKEN_SECRET: string = '';
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private jwt: JwtService,
    private userRepo: UserRepository,
    private readonly userProfileRepo: UserProfileRepository, 

    private readonly connectedAccountsRepository: ConnectedAccountsRepository,

    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {
    this.JWT_REFRESH_TOKEN_SECRET = configService.getOrThrow(MicroserviceEnvKeys.JWT_REFRESH_SECRET);
    this.JWT_TOKEN_SECRET = configService.getOrThrow(MicroserviceEnvKeys.JWT_SECRET);
  }
 

  public async updateWaitingList(updateWaitingListRequest: UpdateWaitingListRequest) {
    try {
      const user = await this.userRepo.findById(updateWaitingListRequest.userId);

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const userProfile = await this.userProfileRepo.findById(user.profile as unknown as string);
      if (!userProfile) {
        throw new NotFoundException(Errors.USER_PROFILE_NOT_FOUND);
      }
 
 
    } catch (error) {
      throw handleException(error);
    }
  }

  public async findAll(req: BaseRequest): Promise<FindUsersResponse[]> {
    try {
      const users = await this.userRepo.findAll();

      return users.map((user) =>
        FindUsersResponse.of(
          user._id,
          user.userName,
          user.firstName,
          user.lastName,
          user.email,
          user.profile,
          user.createdAt,
          user.updatedAt,
        ),
      );
    } catch (error) {
      return null;
    }
  }
  public async personalData(req: BaseRequest) {
    try {
      const user = await this.userRepo.findById(req.authInfo.userId);
      if (!user) return null;
      const profile = await this.userProfileRepo.findById(user.profile as unknown as string);
      return FindUsersResponse.of(
        user._id,
        user.userName,
        user.firstName,
        user.lastName,
        user.email,
        profile,
        user.createdAt,
        user.updatedAt,
      );
    } catch (error) {
      return null;
    }
  }

  public async updateUserInfo(req: UpdateUserRequest) {
    try {
      const user = await this.userRepo.findById(req.authInfo.userId);

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }
      const userProfile = await this.userProfileRepo.findById(user.profile as unknown as string);
      if (!userProfile) {
        throw new NotFoundException(Errors.USER_PROFILE_NOT_FOUND);
      }

      const userEntityBuilder = user.toBuilder();

      if (req.firstName) {
        userEntityBuilder.setFirstName(req.firstName);
      }

      if (req.lastName) {
        userEntityBuilder.setLastName(req.lastName);
      }
      const userEntity = userEntityBuilder.build(true);
      const userProfileEntityBuilder = userProfile.toBuilder();
      if (req.phoneNumber) {
        userProfileEntityBuilder.setphoneNumber(req.phoneNumber);
      }
      if (req.location) {
        userProfileEntityBuilder.setlocation(req.location);
      }
      if (req.website) {
        userProfileEntityBuilder.setwebsite(req.website);
      }
      if (req.website) {
        userProfileEntityBuilder.setProfilePicture(req.profilePicture);
      }

      const userProfileEntity = userProfileEntityBuilder.build();

      delete userEntity._id;
      delete userProfileEntity._id;
      await this.userRepo.findOneAndUpdate({ _id: user._id }, userEntity);
      await this.userProfileRepo.findOneAndUpdate({ _id: userProfile._id }, userProfileEntity);
      return FindUsersResponse.of(
        userEntity._id,
        userEntity.userName,
        userEntity.firstName,
        userEntity.lastName,
        userEntity.email,
        userProfileEntity,
        userEntity.createdAt,
        userEntity.updatedAt,
      );
    } catch (error) {
      throw handleException(error);
    }
  }

  public async getConnectedAccounts(req: BaseRequest) {
    try {
      const { userId } = req.authInfo;

      const connectedAccounts = await this.connectedAccountsRepository.findByUserId(userId);

      // if(!connectedAccounts||connectedAccounts.length<=0) return null

      const supportedSocialMedia = [
        SocialMedia.FACEBOOK,
        SocialMedia.TWITTER,
        SocialMedia.INSTAGRAM,
        SocialMedia.LINKEDIN,
        SocialMedia.GOOGLE,
      ];

      const connectedResponse = supportedSocialMedia.map((socialMedia) => {
        const account = connectedAccounts?.find((account) => account.socialMedia === socialMedia);

        const alreadyConnected = account ? true : false;

        const userName = account ? account.userName : null;

        const icon = socialMedia;

        //capitalize first letter
        const label = socialMedia.charAt(0).toUpperCase() + socialMedia.slice(1);

        const baseUrl = this.configService.getOrThrow(MicroserviceEnvKeys.SERVICE_BASE_URL);

        const servicePath = this.configService.getOrThrow(MicroserviceEnvKeys.SERVICE_PATH);

        const url = `${baseUrl}/${servicePath}/auth/${socialMedia}?userId=${userId}`;

        return ConnectedAccountsResponse.of(label, userName, icon, alreadyConnected, url);
      });

      return connectedResponse;
    } catch (error) {}
  }
  // public async unlink(req:UnlinkSocialMediaRequest):Promise<ResponseOK>{
  //   try {
  //     const {socialMedia,authInfo:{userId}}=req
  //     const connectedAccount = await this.connectedAccountsRepository.findByUserIdSocialMedia(userId,socialMedia)
  //     if(!connectedAccount) {
  //       throw new BadRequestException(Errors.NOT_CONNECTED)
  //     }
  //     const isDeleted = await this.connectedAccountsRepository.deleteOne({
  //       _id:connectedAccount._id
  //     })

  //     if(!isDeleted) {
  //       throw new BadRequestException(Errors.UNABLE_TO_DISCONNECT)
  //     }
  //     return  ResponseOK.of("Successfully unlinked")
      
  //   } catch (error) {
  //     throw handleException(error)
      
  //   }
    
  // }
  public async updateUserState(req: BaseRequest) {}
  public async findByRole(req: BaseRequest) {}
  public async changeUserRole(req: BaseRequest) {}
}
