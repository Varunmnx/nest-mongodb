import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserEntity } from './user.entity';
import { EntityNames } from '@/database/entity-names';

export enum SocialMedia {
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
  INSTAGRAM = 'instagram',
  GOOGLE = 'google',
  META = 'meta',
}

export type ConnectedAccountsDocument = ConnectedAccountsEntity & Document;

@Schema({ collection: 'connectedaccounts' })
export class ConnectedAccountsEntity {
  @Prop({
    type: Types.ObjectId,
    default: new Types.ObjectId(),
  })
  public _id: Types.ObjectId;

  @Prop({ name: 'idToken' })
  public idToken: string;

  @Prop({ name: 'accessToken' })
  public accessToken: string;

  @Prop({ name: 'accessSecret' })
  public accessSecret: string;

  @Prop({ name: 'refreshToken' })
  public refreshToken: string;

  @Prop({ type: String, name: 'userName', default: null, required: false })
  public userName: string;

  @Prop({ type: String, name: 'email', default: null, required: false })
  public email: string;

  @Prop({
    type: String,
    enum: SocialMedia,
    name: 'socialMedia',
    default: SocialMedia.TWITTER,
  })
  public socialMedia: SocialMedia;

  @Prop({ type: Types.ObjectId, ref: EntityNames.USERS, name: 'user' })
  public user: UserEntity;

  @Prop({ type: Date, default: Date.now, select: false, name: 'createdAt' })
  public createdAt: Date;

  @Prop({ type: Date, default: Date.now, name: 'updatedAt' })
  public updatedAt: Date;

  @Prop({ type: 'number', name: 'version' })
  public version = 0;

  public static builder() {
    return new ConnectedAccountsEntity.Builder();
  }

  public toBuilder() {
    const builder = ConnectedAccountsEntity.builder();

    builder._id = this._id;
    builder.idToken = this.idToken;
    builder.accessToken = this.accessToken;
    builder.refreshToken = this.refreshToken;
    builder.socialMedia = this.socialMedia;
    builder.accessSecret = this.accessSecret;
    builder.userName = this.userName;
    builder.email = this.email;
    builder.user = this.user;
    builder.createdAt = this.createdAt;
    builder.updatedAt = this.updatedAt;
    builder.version = this.version;

    return builder;
  }

  public static Builder = class {
    _id: Types.ObjectId;
    idToken: string;
    accessToken: string;
    refreshToken: string;
    accessSecret: string;
    socialMedia: SocialMedia;
    userName: string;
    email: string;
    user: UserEntity;
    createdAt: Date;
    updatedAt: Date;
    version = 0;

    public setIdToken(value: string) {
      this.idToken = value;
      return this;
    }

    public setAccessToken(value: string) {
      this.accessToken = value;
      return this;
    }

    public setRefreshToken(value: string) {
      this.refreshToken = value;
      return this;
    }

    public setAccessSecret(value: string) {
      this.accessSecret = value;
      return this;
    }

    public setUserName(value: string) {
      this.userName = value;
      return this;
    }

    public setEmail(value: string) {
      this.email = value;
      return this;
    }

    public setSocialMedia(value: SocialMedia) {
      this.socialMedia = value;
      return this;
    }

    public setUser(value: UserEntity) {
      this.user = value;
      return this;
    }

    public build(update = false): ConnectedAccountsEntity {
      const e = new ConnectedAccountsEntity();

      if (!this.createdAt) this.createdAt = new Date();

      this.updatedAt = new Date();

      if (!update) {
        this._id = new Types.ObjectId();
        e._id = this._id;
      }

      e.user = this.user;
      e.idToken = this.idToken;
      e.accessToken = this.accessToken;
      e.refreshToken = this.refreshToken;
      e.accessSecret = this.accessSecret;
      e.socialMedia = this.socialMedia;
      e.userName = this.userName;
      e.email = this.email;
      e.createdAt = this.createdAt;
      e.updatedAt = this.updatedAt;
      e.version = e.version + 1;

      return e;
    }
  };
}

export const ConnectedAccountsSchema = SchemaFactory.createForClass(ConnectedAccountsEntity);
ConnectedAccountsSchema.loadClass(ConnectedAccountsEntity);
