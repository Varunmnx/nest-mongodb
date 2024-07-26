import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { hashPassword } from '@common/utils/hash-password';
import { UserProfileEntity } from './user-profile.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EntityNames } from '@/database/entity-names';
import { UserRoles } from '@/common/enums/user-role.enums'; 

export type UserDocument = UserEntity & Document;

@Schema({ collection: 'users' })
export class UserEntity {
  @Prop({
    type: Types.ObjectId,
    default: new Types.ObjectId(),
  })
  public _id: Types.ObjectId;

  @Prop({ name: 'userName' })
  public userName: string;

  @Prop({ name: 'firstName' })
  public firstName: string;

  @Prop({ name: 'lastName' })
  public lastName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @Prop({ name: 'email' })
  public email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Prop({ name: 'password' })
  public password: string;

  @Prop({
    type: String,
    enum: UserRoles,
    name: 'role',
    default: UserRoles.USER,
  })
  public role: UserRoles;

  @Prop({ type: Types.ObjectId, ref: EntityNames.PROFILE, name: 'profile' })
  public profile: UserProfileEntity;

 

  @Prop({ type: Date, default: Date.now, select: false, name: 'createdAt' })
  public createdAt: Date;

  @Prop({ type: Date, default: Date.now, name: 'updatedAt' })
  public updatedAt: Date;

  @Prop({ type: 'number', name: 'version' })
  public version = 0;

  public static builder() {
    return new UserEntity.Builder();
  }

  public toBuilder() {
    const builder = UserEntity.builder();

    builder._id = this._id;
    builder.userName = this.userName;
    builder.email = this.email;
    builder.firstName = this.firstName;
    builder.lastName = this.lastName;
    builder.password = this.password;
    builder.profile = this.profile;
    builder.createdAt = this.createdAt;
    builder.updatedAt = this.updatedAt;
    builder.version = this.version;

    return builder;
  }

  public static Builder = class {
    _id: Types.ObjectId;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    profile: UserProfileEntity; 
    createdAt: Date;
    updatedAt: Date;
    version = 0;

    public setUserName(value: string) {
      this.userName = value;
      return this;
    }

    public setEmail(value: string) {
      this.email = value;
      return this;
    }
    public setPassword(value: string) {
      const hashedPassword = hashPassword(value);
      this.password = hashedPassword;
      return this;
    }
    public setFirstName(value: string) {
      this.firstName = value;
      return this;
    }
    public setLastName(value: string) {
      this.lastName = value;
      return this;
    }

    public setUserProfile(value: UserProfileEntity) {
      this.profile = value;
      return this;
    }
 

    public build(update = false): UserEntity {
      const e = new UserEntity();

      if (!this.createdAt) this.createdAt = new Date();
      if (!update) {
        this._id = new Types.ObjectId();
        e._id = this._id;
      }

      this.updatedAt = new Date();

      e._id = this._id;
      e.userName = this.userName;
      e.firstName = this.firstName;
      e.lastName = this.lastName;
      e.email = this.email;
      e.password = this.password;
      e.profile = this.profile; 
      e.createdAt = this.createdAt;
      e.updatedAt = this.updatedAt;
      e.version = e.version + 1;

      return e;
    }
  };
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);
UserSchema.loadClass(UserEntity);
