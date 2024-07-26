import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
  constructor(private readonly authService: AuthService,
    private readonly configService:ConfigService
  ) {
    super({
      consumerKey: configService.getOrThrow('TWITTER_CONSUMER_KEY'),
      clientId:'TEoxNUUxQkxta2tVT0VwTlRIQmQ6MTpjaQ',
      consumerSecret: configService.getOrThrow('TWITTER_CONSUMER_SECRET'),
      callbackURL:  configService.getOrThrow('TWITTER_CALLBACK_URL'),
      includeEmail: true,
     
    });
  }

  async validate(token: string, tokenSecret: string, profile: any, done: Function) {
    // Call a service to save or update the user in your database
    const user = await this.authService.validateTwitterUser(profile, token, tokenSecret);
    done(null, user);
  }
}
