import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

// Import các Module con
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

// Import các Entity
import { FileEntity } from './files/entities/file.entity';
import { User } from './users/entities/user.entity'; 

// Import các Audit
import { AuditModule } from './audit/audit.module';
import { AuditLog } from './audit/audit.entity';

@Module({
  imports: [
    // 1. Cấu hình biến môi trường
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Kết nối Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        

        entities: [FileEntity, User, AuditLog],         
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    // 3. Kết nối Redis
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),

    // 4. Các Module chức năng
    FilesModule,
    AuthModule,  
    UsersModule, 
    AuditModule,
  ],
})
export class AppModule {}