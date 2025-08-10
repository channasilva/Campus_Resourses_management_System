# Campus Resources Management System - Backend

This is the backend API for the Campus Resources Management System, built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. PostgreSQL Setup

Make sure PostgreSQL is installed and running on your system.

#### Create Database

Run the database setup script:

```bash
npm run setup-db
```

This will create the `campus_resources_db` database.

#### Initialize Tables

Run the database initialization script:

```bash
npm run init-db
```

This will create the necessary tables:
- `users` - Common user table for both students and lecturers
- `students` - Student-specific information
- `lecturers` - Lecturer-specific information

### 3. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/health` - Health check

### Register Request Body

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "lecturer",
  "lecturerId": "LEC001"
}
```

### Login Request Body

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

## Database Schema

### Users Table
- `id` (SERIAL PRIMARY KEY)
- `username` (VARCHAR(50) UNIQUE)
- `email` (VARCHAR(100) UNIQUE)
- `password_hash` (VARCHAR(255))
- `role` (VARCHAR(20) - 'student' or 'lecturer')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Students Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users(id))
- `student_id` (VARCHAR(50) UNIQUE)
- `first_name` (VARCHAR(50))
- `last_name` (VARCHAR(50))
- `department` (VARCHAR(100))
- `year_of_study` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Lecturers Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users(id))
- `lecturer_id` (VARCHAR(50) UNIQUE NOT NULL)
- `first_name` (VARCHAR(50))
- `last_name` (VARCHAR(50))
- `department` (VARCHAR(100))
- `specialization` (VARCHAR(100))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Environment Variables

Create a `.env` file in the server directory:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_resources_db
DB_USER=postgres
DB_PASSWORD=cwinner@15847
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=5000
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation with express-validator
- CORS configuration for frontend integration
- SQL injection protection with parameterized queries

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // For validation errors
}
```

## Development

- The server runs on port 5000 by default
- CORS is configured to allow requests from `http://localhost:3000`
- Hot reloading is enabled with nodemon 