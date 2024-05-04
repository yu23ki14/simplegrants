import { Module } from '@nestjs/common';
import { QfService } from './qf.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { QfController } from './qf.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProviderService } from 'src/provider/provider.service';
import { ProviderModule } from 'src/provider/provider.module';

// @Module({
//   imports: [PrismaModule, ProviderModule],
//   providers: [QfService, PrismaService, ProviderModule],
//   exports: [QfService, PrismaService, ProviderModule],
//   controllers: [QfController],
// })
@Module({
  imports: [PrismaModule, ProviderModule],  // ProviderModule をインポート
  providers: [QfService, PrismaService],  // PrismaService をプロバイダーに追加
  exports: [QfService, PrismaService],  // PrismaService をエクスポート
  controllers: [QfController],
})
export class QfModule {}
