import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { ArtistDto, IsrcDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

@Injectable({})
export class TrackService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async postIsrc(dto: IsrcDto) {
    const { isrc } = dto;

    const tracksItems = [];
    let currentTracks = await this.fetchTracks(
      `https://api.spotify.com/v1/search?q=isrc:${isrc}&type=track&limit=1`,
    );
    tracksItems.push(...currentTracks.items);

    while (currentTracks.next) {
      currentTracks = await this.fetchTracks(currentTracks.next);
      tracksItems.push(...currentTracks.items);
    }
    const popularTrack = tracksItems.reduce((a, b) =>
      a.popularity > b.popularity ? a : b,
    );

    const imageUri = popularTrack.album.images[0].url;
    const title = popularTrack.name;
    const artists = popularTrack.album.artists.map((artist) => {
      return { name: artist.name };
    });

    try {
      // save the new track in the db
      const track = await this.prisma.track.create({
        data: {
          isrc,
          title,
          imageUri,
          artists: { create: artists },
        },
      });

      //return the saved track
      return track;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('ISRC Taken');
        }
      }

      throw error;
    }
  }

  async getIsrc(dto: IsrcDto) {
    // find the track by isrc
    const track = await this.prisma.track.findUnique({
      where: {
        isrc: dto.isrc,
      },
    });
    // if user does not exist throw exception
    if (!track) throw new ForbiddenException('ISRC/Track not found');

    return track;
  }

  async getArtist(dto: ArtistDto) {
    // find the artist by name
    const artist = await this.prisma.artist.findUnique({
      where: {
        name: dto.name,
      },
    });
    console.log(artist);
    // if artist does not exist throw exception
    if (!artist) throw new ForbiddenException('Artist not found');

    // find tracks and artists
    const getTracksAndArtists = await this.prisma.track.findMany({
      include: {
        artists: true,
      },
    });

    // if tracks and artists does not exist throw exception
    if (!artist) throw new ForbiddenException('Tracks for artist not found');

    return getTracksAndArtists;
  }

  async fetchTracks(url: string) {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.config.get('SPOTIFY_TOKEN')}`,
      },
    })
      .then((response) => response.json())
      .then(({ tracks }) => tracks);
  }
}
