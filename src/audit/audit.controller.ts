import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getLogs(
    @Query('page') page = 1, 
    @Query('limit') limit = 10
  ) {
    const { data, total } = await this.auditService.findAll(Number(page), Number(limit));

    // Format dữ liệu để khớp với cái bảng trong ảnh
    const formattedData = data.map((log, index) => ({
      stt: (Number(page) - 1) * Number(limit) + index + 1, // Tính số thứ tự: 1, 2, 3...
      account: log.user ? log.user.username : 'admin', // Cột Tài khoản
      fullName: log.user ? log.user.fullName : '---',           // Cột Họ và tên
      unit: 'Phòng IT',                                       // Cột Đơn vị (Hiện tại fix cứng, sau này thêm bảng Unit sau)
      description: log.action,                                // Cột Mô tả
      method: log.method,                                     // Cột Thao tác
      status: log.status,                                     // Cột Trạng thái (SUCCESS/FAILED)
      ip: log.ip,                                             // Cột Địa chỉ IP
      time: new Date(log.timestamp).toLocaleString('vi-VN', { // Cột Thời gian
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false
      })
    }));

    // Trả về cấu trúc có phân trang
    return {
      data: formattedData,
      meta: {
        total: total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  }
}