import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from './entities/tokens-entity';

@Module({
  imports:[TypeOrmModule.forFeature([TokenEntity])],
  providers: [TokensService],
  exports:[TokensService]
})
export class TokensModule {}
