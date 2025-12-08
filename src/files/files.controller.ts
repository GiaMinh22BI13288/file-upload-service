import { Controller, Post, Get, UploadedFile, UseInterceptors, UseGuards, Request, Query, BadRequestException, Res, Param, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FilesService } from './files.service';
import { extname } from 'path';
import { ApiBody, ApiConsumes, ApiTags, ApiBearerAuth } from '@nestjs/swagger'; 
import { Response } from 'express'; 
import { AuthGuard } from '@nestjs/passport'; 
import { AuditInterceptor } from '../audit/audit.interceptor';

@ApiTags('files') 
@ApiBearerAuth() 
@UseGuards(AuthGuard('jwt')) 
@UseInterceptors(AuditInterceptor)
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    @InjectQueue('file-queue') private fileQueue: Queue,
  ) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
        return cb(new BadRequestException('Chỉ chấp nhận file ảnh hoặc PDF!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) { 
    if (!file) {
      throw new BadRequestException('File is required!');
    }

    // 1. Lưu thông tin vào DB 
    const savedFile = await this.filesService.saveInitialFile(file, req.user); 

    // 2. Đẩy Job vào hàng đợi (Redis)
    await this.fileQueue.add('optimize', {
      fileId: savedFile.id,
      filePath: savedFile.path,
      mimetype: savedFile.mimetype,
    });

    return { 
      message: 'Upload successful, background processing started', 
      file: savedFile 
    };
  }

  @Get(':id/download')
  async downloadFile(@Param('id') id: string, @Res() res: Response, @Request() req) { 
    // 1. Tìm file trong DB 
    const fileEntity = await this.filesService.findOne(id, req.user.userId); 
    
    if (!fileEntity) {
      throw new NotFoundException('File không tồn tại hoặc bạn không có quyền truy cập');
    }

    // 2. Trả file về cho trình duyệt
    res.download(fileEntity.path, fileEntity.originalName);
  }

  @Get()
  async getFiles(
    @Query('page') page = 1, 
    @Query('limit') limit = 10,
    @Request() req 
  ) {
    // Chỉ lấy danh sách file của User đang đăng nhập
    return this.filesService.findAll(req.user.userId, page, limit); 
  }
}