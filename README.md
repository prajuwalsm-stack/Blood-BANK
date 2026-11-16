# Online Blood Bank Management System

A beginner-friendly full-stack project using React, Express.js, Node.js and MySQL.

## Features
- User registration and login with hashed passwords
- JWT-based authentication and logout
- Role-based admin access
- Register blood donors
- Search donors by blood group and city
- View blood inventory
- Submit blood requests
- Simple admin API to add/update inventory
- MySQL database schema and sample data
- Basic validation and error handling

> Educational/demo project. It is not a clinical system. Verify donor eligibility, blood compatibility, identity and availability with a qualified blood bank before any real transfusion. Do not use this project to make medical decisions.

## Requirements
- Node.js 18+
- MySQL 8+
- npm

## 1. Create the database
Open MySQL Workbench or the MySQL command line and run `database/schema.sql`.

## 2. Start the backend
```bash
cd server
cp .env.example .env
```
Edit `.env` with your MySQL username/password, then:
```bash
npm install
npm run dev
```
The API runs at http://localhost:5000.

## 3. Start the React frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL shown by Vite (normally http://localhost:5173).

## API routes
- `GET /api/health` - server status
- `POST /api/donors` - register donor
- `GET /api/donors?bloodGroup=O%2B&city=Bengaluru` - search donors
- `GET /api/inventory` - view blood inventory
- `POST /api/requests` - submit a blood request
- `GET /api/requests` - list requests (demo/admin use)
- `POST /api/inventory` - add/update stock (demo/admin use)

## Important demo note
The inventory and request listing routes are intentionally simple for classroom demonstration. Before deployment, add authentication, role-based authorization, rate limiting, audit logs, stronger validation, HTTPS, privacy controls and secure handling of personal data. Never publish donor phone numbers without consent.


## Authentication (added)
- Register at **Login / Register**. Public registration always creates a normal `user`.
- Login with the registered email and password.
- Logout clears the browser's saved login token.
- Passwords are hashed with bcrypt before being saved.
- The API uses JWT bearer tokens.
- Only an account with role `admin` can update inventory or list all blood requests.

### Create the first admin account
For this classroom project, public registration cannot select the admin role (this prevents users from making themselves administrators). After registering a normal account, promote it manually using MySQL Workbench:

```sql
USE blood_bank;
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Then log out and log back in. The Admin Panel will appear.

### Environment setup
Copy `server/.env.example` to `server/.env`. Set your database password and a long random `JWT_SECRET`. Never upload `.env` or share the secret.

### Security note
This is a learning/demo implementation. For production, use HTTPS, secure HttpOnly cookies or an appropriate token strategy, CSRF protections if cookie-based, rate limiting, email verification, password reset, audit logs, strict input validation, backups and privacy controls. The donor and blood-request forms are currently public; add authorization and consent workflows appropriate to your institution before real deployment.
