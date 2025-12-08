import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FileEntity } from './entities/file.entity';
import { FileProcessor } from './files.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    BullModule.registerQueue({
      name: 'file-queue', 
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, FileProcessor],
})
export class FilesModule {}