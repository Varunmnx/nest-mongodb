import { Subscriptions } from '@common/enums/subscriptions.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type UserProfileDocument = UserProfileEntity & Document;

@Schema({ collection: 'userProfiles' })
export class UserProfileEntity {
  @Prop({
    type: Types.ObjectId,
    default: new Types.ObjectId(),
  })
  _id: Types.ObjectId;

  @Prop({ name: 'dateOfBirth' })
  public dateOfBirth: string;

  @Prop({ name: 'profilePicture' })
  public profilePicture: string;

  @Prop({ name: 'phoneNumber' })
  public phoneNumber: string;

  @Prop({ name: 'location', required: false, default: null })
  public location: string;

  @Prop({ name: 'website', required: false, default: null })
  public website: string;

  @Prop({ type: Date, default: Date.now, select: false, name: 'createdAt' })
  public createdAt: Date;

  @Prop({ type: Date, default: Date.now, name: 'updatedAt' })
  public updatedAt: Date;

  @Prop({ type: 'number', name: 'version' })
  public version = 0;

  public static builder() {
    return new UserProfileEntity.Builder();
  }

  public toBuilder() {
    const builder = UserProfileEntity.builder();

    builder._id = this._id;
    builder.dateOfBirth = this.dateOfBirth;
    builder.phoneNumber = this.phoneNumber;
    builder.location = this.location;
    builder.website = this.website;
    builder.profilePicture = this.profilePicture;
    builder.createdAt = this.createdAt;
    builder.updatedAt = this.updatedAt;
    builder.version = this.version;

    return builder;
  }

  public static Builder = class {
    _id: Types.ObjectId;
    dateOfBirth: string;
    subscription: Subscriptions;
    profilePicture: string;
    phoneNumber: string;
    location: string;
    website: string;
    createdAt: Date;
    updatedAt: Date;
    version = 0;

    public setdateOfBirth(value: string) {
      this.dateOfBirth = value;
      return this;
    }

    public setphoneNumber(value: string) {
      this.phoneNumber = value;
      return this;
    }

    public setProfilePicture(value: string) {
      this.profilePicture = value;
      return this;
    }

    public setlocation(value: string) {
      this.location = value;
      return this;
    }

    public setwebsite(value: string) {
      this.website = value;
      return this;
    }

    public build(update = false): UserProfileEntity {
      const e = new UserProfileEntity();

      if (!this.createdAt) this.createdAt = new Date();
      if (!update) {
        this._id = new Types.ObjectId();
        e._id = this._id;
      }

      this.updatedAt = new Date();

      e._id = this._id;
      e.dateOfBirth = this.dateOfBirth;
      e.profilePicture = this.profilePicture;
      e.phoneNumber = this.phoneNumber;
      e.location = this.location;
      e.website = this.website;
      e.createdAt = this.createdAt;
      e.updatedAt = this.updatedAt;
      e.version = e.version + 1;

      return e;
    }
  };
}
export const UserProfileSchema = SchemaFactory.createForClass(UserProfileEntity);
UserProfileSchema.loadClass(UserProfileEntity);
