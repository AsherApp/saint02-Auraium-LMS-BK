# AuraiumLMS 🎓

A comprehensive Learning Management System built with Next.js, featuring live streaming capabilities, course management, and dual-role authentication for teachers and students.

![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![LiveKit](https://img.shields.io/badge/LiveKit-Video-red)

## ✨ Features

### 👨‍🏫 For Teachers
- **Course Management**: Create, edit, and publish courses with modules
- **Live Classes**: Host HD video sessions with whiteboard and screen sharing
- **Assignment System**: Create assignments with automated grading
- **Student Management**: Track progress and manage enrollments
- **Analytics Dashboard**: Real-time student engagement metrics
- **Billing Integration**: Subscription management and transaction tracking
- **Forum Moderation**: Manage discussions and course communications

### 👨‍🎓 For Students
- **Interactive Dashboard**: Progress tracking and upcoming assignments
- **Live Class Participation**: Join video sessions with chat and whiteboard
- **Assignment Submission**: Submit work and track grades
- **Course Materials**: Access study materials and resources
- **Discussion Forums**: Participate in course discussions
- **Calendar Integration**: View deadlines and scheduled sessions

### 🔧 Core Capabilities
- **Real-time Video Streaming**: Powered by LiveKit
- **Dual Authentication**: Separate teacher and student login systems
- **Responsive Design**: Optimized for desktop and mobile
- **Dark Theme Support**: Modern UI with theme switching
- **Notification System**: Real-time updates and alerts
- **Multi-tenant Architecture**: Teacher isolation and role-based access

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS with animations
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics

### Backend
- **API**: Next.js API routes + Express.js server
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with Supabase Auth
- **Storage**: Supabase Storage
- **Live Streaming**: LiveKit SDK

### Development
- **Package Manager**: npm
- **Code Quality**: ESLint + TypeScript
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- LiveKit account (for video features)

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lms-auth-starter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create `.env.local` file:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # LiveKit Configuration
   NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   
   # Application
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Database Setup**
   
   Run the database migrations (see `SUPABASE_SETUP_GUIDE.md` for detailed instructions):
   ```bash
   # Run the setup script
   ./setup_transactions_env.sh
   ./run_transactions_migration.sh
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` to see the application.

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── (lms)/             # Main LMS routes
│   │   ├── student/       # Student dashboard & features
│   │   ├── teacher/       # Teacher dashboard & features
│   │   ├── forum/         # Discussion forums
│   │   └── live/          # Live streaming pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── shared/           # Shared UI components
│   ├── teacher/          # Teacher-specific components
│   └── live/             # Live streaming components
├── Endubackend/          # Express.js backend server
├── services/             # API integration services
├── hooks/                # Custom React hooks
└── utils/                # Utility functions
```

## 🔐 Authentication System

### Teacher Registration
- Email/password authentication
- Billing integration during signup
- Access to course creation and management

### Student Access
- Student code-based login
- Invite-only registration system
- Limited to enrolled courses

## 📱 Live Streaming Features

- **HD Video & Audio**: Professional quality streaming
- **Interactive Whiteboard**: Real-time drawing and annotations  
- **Screen Sharing**: Share presentations and materials
- **Participant Management**: Mute, remove, and manage attendees
- **Chat Integration**: Real-time messaging during sessions
- **Recording Capabilities**: Save sessions for later viewing

## 💾 Database Schema

Key tables include:
- `users` - User authentication and profiles
- `courses` - Course information and materials
- `enrollments` - Student-course relationships
- `assignments` - Assignment details and submissions
- `live_sessions` - Scheduled live classes
- `discussions` - Forum discussions and posts
- `teacher_transactions` - Billing and subscription data

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all production environment variables are configured:
- Database URLs and API keys
- LiveKit production endpoints
- Authentication secrets
- CORS origins

## 📚 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Review setup guides: `SUPABASE_SETUP_GUIDE.md`
- Create an issue in the repository
- Contact the development team

## 🚧 Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with external calendar systems
- [ ] Automated grading with AI
- [ ] Multi-language support
- [ ] Advanced content authoring tools

---

**AuraiumLMS** - Empowering education through technology 🎓✨