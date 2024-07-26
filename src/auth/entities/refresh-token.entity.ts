import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserEntity } from './user.entity';
import { EntityNames } from '@/database/entity-names';

export type RefreshTokenDocument = RefreshTokenEntity & Document;

@Schema({ collection: 'refreshtoken' })
export class RefreshTokenEntity {
  @Prop({
    type: Types.ObjectId,
    default: new Types.ObjectId(),
  })
  public _id: Types.ObjectId;

  @Prop({ name: 'sessionId' })
  public sessionId: string;

  @Prop({ name: 'token' })
  public token: string;

  @Prop({ type: Types.ObjectId, ref: EntityNames.USERS, name: 'user' })
  public user: UserEntity;

  @Prop({ type: Date, name: 'expiryDate' })
  public expiryDate: Date;

  @Prop({ type: Date, default: Date.now, select: false, name: 'createdAt' })
  public createdAt: Date;

  @Prop({ type: Date, default: Date.now, name: 'updatedAt' })
  public updatedAt: Date;

  @Prop({ type: 'number', name: 'version' })
  public version = 0;

  public static builder() {
    return new RefreshTokenEntity.Builder();
  }

  public toBuilder() {
    const builder = RefreshTokenEntity.builder();

    builder._id = this._id;
    builder.token = this.token;
    builder.sessionId = this.sessionId;
    builder.user = this.user;
    builder.expiryDate = this.expiryDate;
    builder.createdAt = this.createdAt;
    builder.updatedAt = this.updatedAt;
    builder.version = this.version;

    return builder;
  }

  public static Builder = class {
    _id: Types.ObjectId;
    expiryDate: Date;
    sessionId: string;
    user: UserEntity;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    version = 0;

    public setExpiryDate(value: Date) {
      this.expiryDate = value;
      return this;
    }

    public setToken(value: string) {
      this.token = value;
      return this;
    }

    public setSessionId(value: string) {
      this.sessionId = value;
      return this;
    }

    public setUser(value: UserEntity) {
      this.user = value;
      return this;
    }

    public build(): RefreshTokenEntity {
      const e = new RefreshTokenEntity();

      if (!this.createdAt) this.createdAt = new Date();
      if (!e._id) this._id = new Types.ObjectId();

      this.updatedAt = new Date();

      e._id = this._id;
      e.user = this.user;
      e.sessionId = this.sessionId;
      e.token = this.token;
      e.expiryDate = this.expiryDate;
      e.createdAt = this.createdAt;
      e.updatedAt = this.updatedAt;
      e.version = e.version + 1;

      return e;
    }
  };
}
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshTokenEntity);
RefreshTokenSchema.loadClass(RefreshTokenEntity);
