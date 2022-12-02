import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Profile, Strategy, VerifyCallback } from 'passport-spotify';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SpotifyOauthStrategy extends PassportStrategy(
  Strategy,
  'spotify',
) {
  constructor(config: ConfigService) {
    super(
      {
        clientID: config.get('SPOTIFY_CLIENT_ID'),
        clientSecret: config.get('SPOTIFY_CLIENT_SECRET'),
        callbackURL: config.get('SPOTIFY_CALLBACK_URL'),
        // scope: config.get('SPOTIFY_SCOPE'),
      },
      (
        accessToken: string,
        refreshToken: string,
        expires_in: number,
        profile: Profile,
        done: VerifyCallback,
      ): void => {
        return done(null, profile, { accessToken, refreshToken, expires_in });
      },
    );
  }
}
