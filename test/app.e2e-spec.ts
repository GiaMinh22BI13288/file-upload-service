// 👇 1. QUAN TRỌNG: Thêm dòng này ngay đầu file test để tránh lỗi thư viện
global['crypto'] = require('crypto');

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  const randomSuffix = Date.now();
  const testUser = {
    username: `user_test_${randomSuffix}`,
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    // Đóng ứng dụng sạch sẽ sau khi test
    await app.close();
  });

  // --- KỊCH BẢN 1: AUTHENTICATION ---
  
  it('/auth/register (POST) - Should register new user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201)
      .then((response) => {
        expect(response.body.id).toBeDefined();
      });
  });

  it('/auth/login (POST) - Should login and return JWT', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(201)
      .then((response) => {
        expect(response.body.access_token).toBeDefined();
        jwtToken = response.body.access_token; 
      });
  });

  // --- KỊCH BẢN 2: FILE UPLOAD ---

  it('/files/upload (POST) - Should upload file successfully with Token', async () => {
    // 👇 2. SỬA LỖI: Đổi tên file thành .pdf để qua được bộ lọc của Controller
    const fileName = 'test-file.pdf'; 
    const filePath = path.join(__dirname, fileName);
    
    // Tạo nội dung giả cho file PDF
    fs.writeFileSync(filePath, '%PDF-1.5 fake content');

    return request(app.getHttpServer())
      .post('/files/upload')
      .set('Authorization', `Bearer ${jwtToken}`)
      .attach('file', filePath)
      .expect(201) // Mong đợi 201 Created
      .then((response) => {
        // Dọn dẹp file giả
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        
        expect(response.body.message).toContain('success');
        expect(response.body.file).toBeDefined();
        // Kiểm tra đúng tên file
        expect(response.body.file.originalName).toEqual(fileName);
      })
      .catch((err) => {
        // Dọn dẹp nếu test lỗi
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw err;
      });
  });

  it('/files (GET) - Should Fail without Token', () => {
    return request(app.getHttpServer())
      .get('/files')
      .expect(401); 
  });

  it('/files/upload (POST) - Should Fail with invalid file type', async () => {
    // Tạo file .exe giả
    const fileName = 'virus.exe';
    const badFilePath = path.join(__dirname, fileName);
    fs.writeFileSync(badFilePath, 'Fake Virus');

    return request(app.getHttpServer())
      .post('/files/upload')
      .set('Authorization', `Bearer ${jwtToken}`)
      .attach('file', badFilePath)
      .expect(400) // Mong đợi lỗi 400 (Bad Request)
      .then(() => {
        if (fs.existsSync(badFilePath)) fs.unlinkSync(badFilePath);
      })
      .catch((err) => {
        if (fs.existsSync(badFilePath)) fs.unlinkSync(badFilePath);
        throw err;
      });
  });
});