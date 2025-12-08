import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity, FileStatus } from './entities/file.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
  ) {}

  async saveInitialFile(file: Express.Multer.File, user: any) {
    const newFile = this.fileRepository.create({
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      path: file.path,
      status: FileStatus.PENDING,
    });
    newFile.user = user.userId;
    return await this.fileRepository.save(newFile);
  }

  async updateStatus(id: string, status: FileStatus, metadata: any = null) {
    await this.fileRepository.update(id, { status, metadata });
  }

  async findAll(userId: string, page: number, limit: number) {
  return await this.fileRepository.findAndCount({
    where: { user: { id: userId } }, 
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' }
  });
  }
  async findOne(id: string, userId: string) {
  return await this.fileRepository.findOne({
    where: { id, user: { id: userId } }
  });
  }
}