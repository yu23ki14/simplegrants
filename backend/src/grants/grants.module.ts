import { Module } from '@nestjs/common';
import { GrantsService } from './grants.service';
import { GrantsController } from './grants.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProviderModule } from 'src/provider/provider.module';
import { AwsModule } from 'src/aws/aws.module';
import { QfModule } from 'src/qf/qf.module';

@Module({
  imports: [PrismaModule, ProviderModule, AwsModule, QfModule],
  providers: [GrantsService],
  controllers: [GrantsController],
})
export class GrantsModule {}
