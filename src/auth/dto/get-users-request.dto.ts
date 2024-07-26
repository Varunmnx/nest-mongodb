import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BaseRequest } from '@common/base.request';
import { UserRoles } from '@/common/enums/user-role.enums';
import { SocialMedia } from '../entities/connected-accounts.entity';

export class GetUserByRoleRequest extends BaseRequest {
  @ApiProperty({ type: String, description: 'User role' })
  @IsEnum(UserRoles)
  role: string;
}

export class User {
  @ApiProperty({ type: String, description: 'User Id' })
  _id: string;

  @ApiProperty({ type: String, description: 'Date Of Birth' })
  dateOfBirth: string;

  @ApiProperty({ type: String, description: 'Subscription Plan' })
  subscription: string;

  @ApiProperty({ type: String, description: 'Profile Picture URL' })
  profilePicture: string;

  @ApiProperty({ type: String, description: 'Phone Number' })
  phoneNumber: string;

  @ApiProperty({ type: String, description: 'Created At' })
  createdAt: Date;

  @ApiProperty({ type: String, description: 'Updated At' })
  updatedAt: Date;

  constructor(
    _id: string,
    dateOfBirth: string,
    subscription: string,
    profilePicture: string,
    phoneNumber: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this._id = _id;
    this.dateOfBirth = dateOfBirth;
    this.subscription = subscription;
    this.profilePicture = profilePicture;
    this.phoneNumber = phoneNumber;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class GetUsersByRoleResponse {
  @ApiProperty({ type: [User], description: 'List of Users' })
  users: User[];

  constructor(users: User[]) {
    this.users = users;
  }

  public static of(users: User[]): GetUsersByRoleResponse {
    return new GetUsersByRoleResponse(users);
  }
}

export class ConnectedAccountsResponse {
    @ApiProperty({ type: String, description: 'User Id' })
    label: string;

    @ApiProperty({ type: String, description: 'User Name' })
    username: string;

    @ApiProperty({ type: String, description: 'Social Media Icon' })
    icon: SocialMedia;


    @ApiProperty({ type: Boolean, description: 'Already Connected' })
    alreadyConnected: boolean;

    @ApiProperty({type:String,description:'Redirect Url',nullable:true})
    redirectUrl?:string


    constructor(label: string, username: string, icon: SocialMedia, alreadyConnected: boolean,redirectUrl='') {
      this.label = label;
      this.username = username;
      this.icon = icon;
      this.alreadyConnected = alreadyConnected;
      this.redirectUrl = redirectUrl;

    }

    public static of(label: string, username: string, icon: SocialMedia, alreadyConnected: boolean, redirectUrl=''): ConnectedAccountsResponse {
      return new ConnectedAccountsResponse (label, username, icon, alreadyConnected, redirectUrl);
    }
    
  
}