# File Upload & Processing Service (NestJS)

<p align="center">
  <a href="https://nestjs.com" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  </a>
</p>

<p align="center">
  A backend service built with <b>NestJS</b> that provides secure file upload, background file processing, and audit logging via RESTful APIs.
</p>

---

## 1. Project Overview

This project implements a **File Upload & Processing Service** that allows authenticated users to upload files (Image, PDF, Word, Excel), store file metadata, and process files asynchronously using a background job queue.

The system is designed following **modular architecture principles**, focusing on scalability, maintainability, and clear separation of concerns.

Key objectives of the project:

* Secure file upload using JWT authentication
* Asynchronous file processing with Redis + Bull
* Metadata storage using PostgreSQL
* Audit logging for critical user actions
* Well-documented APIs using Swagger

---

## 2. Supported File Types

| File Type              | Upload Supported | Background Processing  |
| ---------------------- | ---------------- | ---------------------- |
| Image (jpg, png, jpeg) | Yes              | Generate thumbnail     |
| PDF                    | Yes              | Extract text           |
| Word (doc, docx)       | Yes              | Extract text           |
| Excel (xls, xlsx)      | Yes              | No processing required |

---

## 3. System Architecture

The application follows NestJS **Modular Architecture** and consists of the following core modules:

* **AppModule**: Root module that wires all components together
* **AuthModule**: Handles user registration, login, and JWT authentication
* **FilesModule**: Manages file upload, download, metadata storage, and background job dispatching
* **AuditModule**: Records audit logs for important actions (login, upload, download)

### Technology Stack

* **Framework**: NestJS (TypeScript)
* **Database**: PostgreSQL + TypeORM
* **Background Jobs**: Redis + Bull
* **Authentication**: JWT + BCrypt
* **File Upload**: Multer (Disk Storage)
* **API Documentation**: Swagger (OpenAPI)

---

## 4. Authentication & Security

* Users authenticate via **JWT (JSON Web Token)**
* Passwords are hashed using **BCrypt**
* Protected APIs require:

```http
Authorization: Bearer <access_token>
```

* File access is restricted to the file owner

---

## 5. File Upload & Processing Workflow

1. User uploads a file via `/files/upload`
2. File is saved to the local filesystem (`./uploads`)
3. Metadata is stored in PostgreSQL with status `PENDING`
4. A background job is pushed to Redis queue
5. FileProcessor processes the job:

   * Image → thumbnail generation
   * PDF / Word → text extraction
6. File status is updated to `DONE` or `FAILED`

---

## 6. Audit Logging

The system automatically records audit logs for critical actions:

* User login
* File upload
* File download

Audit logs include:

* User ID (or GUEST)
* HTTP method
* API endpoint
* IP address
* Timestamp

Audit logs can be retrieved via `/audit` (JWT required).

---

## 7. API Documentation

Swagger documentation is available at:

```
http://localhost:3000/api
```

It provides:

* Interactive API testing
* JWT authentication support
* Detailed request/response schemas

---

## 8. Project Setup

### Install dependencies

```bash
npm install
```

### Environment Configuration

Create a `.env` file based on the following example:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=file_service
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
```

---

## 9. Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

---

## 10. Running Tests

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 11. Deployment

The application supports containerized deployment using Docker and Docker Compose.

Typical deployment stack:

* NestJS application container
* PostgreSQL container
* Redis container

Refer to `docker-compose.yml` for deployment configuration.

---

## 12. Future Improvements

* Add support for cloud storage (MinIO / S3)
* Implement file search and filtering
* Add role-based access control (RBAC)
* Enhance Excel preview processing
* Improve test coverage for background jobs

---

## 13. License

This project is developed for academic and learning purposes and follows the MIT License.

---

## 14. Author

Developed as part of a backend engineering project using NestJS.

---

If you have any questions or suggestions, feel free to open an issue or contribute to the project.
