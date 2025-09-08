# Project & Task Management Application

A comprehensive web-based project and task management application with unique daily reset functionality, supporting both individual users and companies.

## 🚀 Features

- **Multi-User Support**: Individual users and company accounts
- **Daily Task Reset**: Automatic task completion reset at midnight (user timezone)
- **Project Management**: Support for Kanban, Scrum, Agile, Waterfall methodologies
- **Advanced Analytics**: Dashboards, reporting, and performance tracking
- **Team Collaboration**: Role-based permissions and workspace switching
- **REST API**: Integration with automation platforms

## 🛠️ Technology Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT with email/password

## 📁 Project Structure
-├── frontend/          # React.js client application
-├── backend/           # Node.js API server
-├── database/          # Database schemas and migrations
-├── docs/              # Project documentation
-└── scripts/           # Deployment and utility scripts

## 🚦 Development Status

- [x] Project Setup & Repository Structure
- [ ] Phase 1: Authentication & Basic Project Management
- [ ] Phase 2: Daily Tasks & Reset System
- [ ] Phase 3: Project Management Methodologies
- [ ] Phase 4: Dashboards & Reporting
- [ ] Phase 5: Company Features & Multi-User
- [ ] Phase 6: Advanced Features & API

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Git

### Installation
```bash
# Clone repository
git clone https://github.com/3bez/project-task-management-app.git
cd project-task-management-app

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Set up database
cd ../database
# Follow database setup instructions
Running the Application
bash# Start backend server (Terminal 1)
cd backend
npm run dev

# Start frontend development server (Terminal 2)  
cd frontend
npm start
📖 Documentation

Business Requirements Document
API Documentation
Setup Instructions
Development Roadmap

🤝 Contributing
This is a private project. For any questions or contributions, please contact the project maintainer.
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

Developed by: Abdulaziz Alangari
Repository: https://github.com/3bez/project-task-management-app

## **Environment Template (.env.example)**

Create this file in the root directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_management_app
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email Configuration (for user invitations)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
Updated .gitignore
Add these lines to your existing .gitignore:
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Dependencies
frontend/node_modules/
backend/node_modules/

# Build outputs
frontend/build/
backend/dist/

# Database
*.db
*.sqlite

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

Next Steps:

Copy all files above to your repository
Commit the structure: git add . && git commit -m "feat: initial project structure setup"
I'll start coding Phase 1 with the authentication system and basic project management

Ready for me to begin Phase 1 development? 🎯
