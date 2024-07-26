import { EntityNames } from '@/database/entity-names';
import { RefreshTokenSchema } from './refresh-token.entity';
import { UserProfileSchema } from './user-profile.entity';
import { UserSchema } from './user.entity'; 

export const AuthServiceSchemas = [
  { name: EntityNames.USERS, schema: UserSchema },
  { name: EntityNames.PROFILE, schema: UserProfileSchema },
  { name: EntityNames.REFRESH_TOKEN, schema: RefreshTokenSchema },  
  { name: EntityNames.CONNECTED_ACCOUNTS, schema: UserProfileSchema },
];
