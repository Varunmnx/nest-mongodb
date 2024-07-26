import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { BaseRequest } from '@common/base.request';
import { UserRoles } from '@/common/enums/user-role.enums';
import { UserProfileEntity } from '../entities/user-profile.entity';
import { Types } from 'mongoose'; 

export class LoginRequest extends BaseRequest {
  @ApiProperty({ type: String, description: 'Email id' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({ type: String, description: 'Password' })
  @IsNotEmpty({ message: 'password must not be null' })
  @IsString()
  password: string;
}

export class RegisterUserRequest extends BaseRequest {
  @ApiProperty({ type: String, description: 'First name' })
  @IsNotEmpty({ message: 'First name must not be null' })
  @IsString()
  firstName: string;

  @ApiProperty({ type: String, description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ type: String, description: 'user name' })
  @IsNotEmpty({ message: 'User name must not be null' })
  @IsString()
  userName: string;

  @ApiProperty({ type: String, description: 'Email id' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email must not be null' })
  email: string;

  @ApiProperty({ type: String, description: 'Password' })
  @IsNotEmpty({ message: 'Password must not be null' })
  @IsString()
  password: string;

  @ApiProperty({ type: String, description: 'Phone Number' })
  @IsNotEmpty({ message: 'Phone Number must not be null' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ type: String, description: 'location', name: 'location' })
  @IsOptional()
  @ApiPropertyOptional()
  // @IsNotEmpty({ message: 'location must not be null' })
  @IsString()
  location: string;

  @ApiProperty({ type: String, description: 'website', name: 'website' })
  @IsOptional()
  @ApiPropertyOptional()
  // @IsNotEmpty({ message: 'website must not be null' })
  @IsString()
  website: string;
}

export class AuthoriseUserResponse {
  @ApiProperty({ type: String, description: 'User Id' })
  userId: string | Types.ObjectId;
  @ApiProperty({ type: String, description: 'Email Id' })
  emailId: string;
  @ApiProperty({ type: Boolean, description: 'Is User in Waiting List' })
  isInWaitingList: boolean;
  @ApiProperty({ type: String, description: 'token', required: false })
  token?: string;
  @ApiProperty({ type: String, description: 'Refresh token', required: false })
  refreshToken?: string;
  constructor(
    userId: string | Types.ObjectId,
    emailId: string,
    isInWaitingList: boolean,
    token?: string,
    refreshToken?: string,
  ) {
    this.userId = userId;
    this.emailId = emailId;
    this.isInWaitingList = isInWaitingList;
    if (token) {
      this.token = token;
    }
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
  }
  public static of(
    userId: string | Types.ObjectId,
    emailId: string,
    isInWaitingList: boolean,
    token?: string,
    refreshToken?: string,
  ): AuthoriseUserResponse {
    return new AuthoriseUserResponse(userId, emailId, isInWaitingList, token, refreshToken);
  }
}

export class ConnectSocialMediaRequest {
  @ApiProperty({ type: String, description: 'userId', name: 'userId' })
  @IsString({ message: 'User Id must be a string' })
  @IsNotEmpty({ message: 'User Id must not be empty' })
  userId: string;
}

 

export class TweetRequest extends BaseRequest {
  @ApiProperty({ type: String, description: 'Tweet' })
  @IsString({ message: 'Tweet must be a string' })
  @IsNotEmpty({ message: 'Tweet must not be empty' })
  tweet: string;
}

export class RefreshTokenRequest {
  @ApiProperty({ type: String, description: 'Refresh Token' })
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token must not be empty' })
  refreshToken: string;
}

export class RefreshTokenResponse {
  @ApiProperty({ type: String, description: 'Refresh Token' })
  refreshToken: string;
  @ApiProperty({ type: String, description: 'Access Token' })
  token: string;
  constructor(refreshToken: string, accessToken: string) {
    this.refreshToken = refreshToken;
    this.token = accessToken;
  }
  public static of(refreshToken: string, accessToken: string): RefreshTokenResponse {
    return new RefreshTokenResponse(refreshToken, accessToken);
  }
}

export class FindUsersResponse {
  @ApiProperty({ type: String, description: 'User Id' })
  id: string | Types.ObjectId;

  @ApiProperty({ type: String, description: 'User Name' })
  userName: string;

  @ApiProperty({ type: String, description: 'first Name' })
  firstName: string;

  @ApiProperty({ type: String, description: 'Last Name' })
  lastName: string;

  @ApiProperty({ type: String, description: 'Email' })
  email: string;

  @ApiProperty({ type: String, description: 'Profile' })
  profile: UserProfileEntity;

  @ApiProperty({ type: String, description: 'Created At date' })
  createdAt: Date;

  @ApiProperty({ type: String, description: 'Updated At date' })
  updatedAt: Date;

  constructor(
    id: string | Types.ObjectId,
    userName: string,
    firstName: string,
    lastName: string,
    email: string,
    profile: UserProfileEntity,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.userName = userName;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.profile = profile;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public static of(
    id: string | Types.ObjectId,
    userName: string,
    firstName: string,
    lastName: string,
    email: string,
    profile: UserProfileEntity,
    createdAt: Date,
    updatedAt: Date,
  ): FindUsersResponse {
    return new FindUsersResponse(id, userName, firstName, lastName, email, profile, createdAt, updatedAt);
  }
}

export class GetRoleRequest extends BaseRequest {
  @ApiProperty({ enum: UserRoles, type: UserRoles, description: ' Role type' })
  // @IsString({message:"Role type must be a string"})
  @IsEnum(UserRoles)
  @IsNotEmpty({ message: 'Role type must not be empty' })
  roleType: UserRoles;
}

export class UpdateUserRequest extends BaseRequest {
  //firstName
  @ApiProperty({ type: String, description: 'First Name' })
  @IsString({ message: 'First Name must be a string' })
  @IsOptional()
  @ApiProperty({ type: String, description: 'First Name' })
  firstName: string;

  //lastName
  @ApiProperty({ type: String, description: 'Last Name' })
  @IsString({ message: 'Last Name must be a string' })
  @IsOptional()
  @ApiProperty({ type: String, description: 'Last Name' })
  lastName: string;

  //phoneNumber
  @ApiProperty({ type: String, description: 'Phone Number' })
  @IsString({ message: 'Phone Number must be a string' })
  @IsOptional()
  @ApiProperty({ type: String, description: 'Phone Number' })
  phoneNumber: string;

  //location
  @ApiProperty({ type: String, description: 'Location' })
  @IsString({ message: 'Location must be a string' })
  @IsOptional()
  @ApiProperty({ type: String, description: 'Location' })
  location: string;

  //website
  @ApiProperty({ type: String, description: 'Website' })
  @IsString({ message: 'Website must be a string' })
  @IsOptional()
  @ApiProperty({ type: String, description: 'Website' })
  website: string;

  @ApiProperty({ type: String, description: 'profilePicture' })
  @IsString({ message: 'profilePicture must be a string' })
  @IsOptional()
  @ApiProperty({ type: String, description: 'profilePicture' })
  profilePicture: string;
}
export class UpdateRoleRequest extends BaseRequest {
  @ApiProperty({ enum: UserRoles, type: UserRoles, description: 'User Role' })
  // @IsString({message:"Role type must be a string"})
  @IsEnum(UserRoles)
  @IsNotEmpty({ message: 'Role  must not be empty' })
  role: UserRoles;

  @ApiProperty({ type: String, description: 'User Id' })
  @IsString({ message: 'User Id must be a string' })
  // @IsEnum(UserRoles)
  @IsNotEmpty({ message: 'User id must not be empty' })
  userId: string;
}

export class ActivateAccountRequest extends BaseRequest {
  @ApiProperty({ type: String, description: 'User Id' })
  @IsString({ message: 'User Id must be a string' })
  @IsNotEmpty({ message: 'User id must not be empty' })
  userId: string;
}
export class UpdateWaitingListRequest {
  @ApiProperty({ type: String, description: 'User Id' })
  @IsString({ message: 'User Id must be a string' })
  @IsNotEmpty({ message: 'User id must not be empty' })
  userId: string;

  @ApiProperty({ type: Boolean, description: 'Is User a Realtor Interested In AI' })
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRealtorInterestedInAI: boolean;

  @ApiProperty({ type: Boolean, description: 'Is the User Contacted' })
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isContacted: boolean;
}
