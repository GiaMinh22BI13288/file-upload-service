import { Controller, Post, Get, Delete, UploadedFile, UseInterceptors, UseGuards, Request, Query, BadRequestException, Res, Param, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FilesService } from './files.service';
import { extname } from 'path';
import { AuditInterceptor } from '../audit/audit.interceptor'; 
import { ApiBody, ApiConsumes, ApiTags, ApiBearerAuth, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express'; 
import { AuthGuard } from '@nestjs/passport';

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

  // --- 1. API UPLOAD ---
  @Post('upload')
  // 👇👇👇 Thêm mô tả chi tiết cho Swagger 👇👇👇
  @ApiOperation({ summary: 'Upload file mới', description: 'Hỗ trợ: Ảnh (jpg, png), PDF, Word. Tối đa 5MB.' })
  @ApiResponse({ status: 201, description: 'Upload thành công, file đang được xử lý ngầm.' })
  @ApiResponse({ status: 400, description: 'Lỗi định dạng file hoặc file quá lớn.' })
  // 👆👆👆
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
      if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|docx|doc)$/)) {
        req['fileValidationError'] = 'Chỉ chấp nhận file ảnh, PDF hoặc Word!';
        return cb(null, false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (req['fileValidationError']) {
      throw new BadRequestException(req['fileValidationError']);
    }
    
    if (!file) {
      throw new BadRequestException('File is required!');
    }

    const savedFile = await this.filesService.saveInitialFile(file, req.user);

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

  // --- 2. API DOWNLOAD ---
  @Get(':id/download')
  // 👇👇👇 Thêm mô tả chi tiết 👇👇👇
  @ApiOperation({ summary: 'Tải file', description: 'Tải file gốc từ server về máy tính.' })
  @ApiResponse({ status: 200, description: 'Trả về stream file.' })
  @ApiResponse({ status: 404, description: 'File không tồn tại.' })
  // 👆👆👆
  async downloadFile(@Param('id') id: string, @Res() res: Response, @Request() req) {
    const fileEntity = await this.filesService.findOne(id, req.user.userId);
    
    if (!fileEntity) {
      throw new NotFoundException('File không tồn tại hoặc bạn không có quyền truy cập');
    }

    res.download(fileEntity.path, fileEntity.originalName);
  }

  // --- 3. API SEARCH ---
  @Get('search')
  // 👇👇👇 Thêm mô tả chi tiết 👇👇👇
  @ApiOperation({ summary: 'Tìm kiếm file', description: 'Tìm theo tên file HOẶC nội dung văn bản bên trong file (OCR).' })
  @ApiResponse({ status: 200, description: 'Danh sách file phù hợp.' })
  // 👆👆👆
  @ApiQuery({ name: 'q', required: true, description: 'Từ khóa tìm kiếm' }) 
  async search(@Query('q') keyword: string, @Request() req) {
    return this.filesService.searchFiles(req.user.userId, keyword);
  }

  // --- 4. API DELETE ---
  @Delete(':id')
  // 👇👇👇 Thêm mô tả chi tiết 👇👇👇
  @ApiOperation({ summary: 'Xóa file', description: 'Xóa mềm (Soft delete), đưa file vào thùng rác.' })
  @ApiResponse({ status: 200, description: 'Đã xóa thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy file.' })
  // 👆👆👆
  async remove(@Param('id') id: string, @Request() req) {
    await this.filesService.remove(id, req.user.userId);
    return { message: 'Đã xóa file vào thùng rác thành công' };
  }

  // --- 5. API GET LIST ---
  @Get()
  // 👇👇👇 Thêm mô tả chi tiết 👇👇👇
  @ApiOperation({ summary: 'Lấy danh sách file', description: 'Lấy tất cả file của user hiện tại, có phân trang.' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách file và tổng số lượng.' })
  // 👆👆👆
  async getFiles(
    @Query('page') page = 1, 
    @Query('limit') limit = 10,
    @Request() req
  ) {
    return this.filesService.findAll(req.user.userId, page, limit); 
  }
}