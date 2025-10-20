# Hospital Management System (Vinmec)

A comprehensive healthcare management system built with modern web technologies, designed to streamline hospital operations including patient management, doctor scheduling, appointments, medical records, pharmacy, and payment processing.

## 🏥 Overview

This is a hospital management project developed by Group 1 for the ERP course. Although the system is still incomplete in some parts, it already includes the essential functions of a management system with full user roles. Due to the urgent two-week deadline, our goal was to complete a working version. After that, we plan to continuously improve and restructure the code.

This project is created for the community — a place where we contribute our humble knowledge, and above all, our dedication and passion.

Most importantly, we had the opportunity to work together — staying up late, discussing ideas, and coding side by side. As time passes and we each take different paths, we’ll always look back fondly on this beautiful period — when we had one another and shared the burning passion and aspirations of our youth.

## 🚀 Technology Stack

### Frontend Framework

- **React 19.1.1** - Modern React with concurrent features
- **TypeScript** - Type-safe JavaScript development
- **Vite 7.1.7** - Fast build tool and development server

### UI & Styling

- **Tailwind CSS 4.1.14** - Utility-first CSS framework
- **Radix UI** - Comprehensive component library
- **Lucide React** - Beautiful icon library
- **Shadcn/ui** - Pre-built components based on Radix UI

### Data Management

- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **Supabase** - Backend-as-a-Service for database and authentication

### Additional Libraries

- **Recharts** - Data visualization and charts
- **Date-fns** - Date manipulation utilities
- **React Router** (implied) - Client-side routing
- **Sonner** - Toast notifications
- **Cmdk** - Command palette functionality

## 📋 Features

### Core Modules

- **📊 Dashboard** - Overview of hospital operations and statistics
- **👥 Patient Management** - Patient records, registration, and history
- **👨‍⚕️ Doctor Management** - Doctor profiles and credentials
- **🏢 Department Management** - Hospital department organization
- **📅 Appointments** - Scheduling and calendar management
- **📋 Medical Records** - Patient medical history and treatments
- **💊 Pharmacy** - Medication inventory and prescription management
- **💳 Payments** - Billing and payment processing
- **⏰ Schedules** - Staff scheduling and shift management
- **⚙️ Settings** - System configuration and preferences

### Role-Based Access Control

- **Admin**: Full system access
- **Pharmacist**: Pharmacy module only
- **Facility Manager**: Department management
- **Cashier**: Payment processing

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn package manager

### Clone and Install

```bash
git clone <https://github.com/HuyThang011104/hospital-luxury>
cd hospital-luxury
npm install
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── pages/          # Page components for each module
│   ├── ui/             # Reusable UI components
│   └── layouts/        # Layout components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── interfaces/         # TypeScript interface definitions
├── lib/                # Utility libraries and configurations
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── assets/             # Static assets (images, etc.)
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
├── index.css           # Global styles
└── App.css             # App-specific styles
```

## 🔧 Configuration

### TypeScript Configuration

- Base configuration in `tsconfig.json`
- App-specific settings in `tsconfig.app.json`
- Node.js settings in `tsconfig.node.json`
- Path alias configured: `@/*` maps to `./src/*`

### ESLint Configuration

- Modern flat config setup
- React and TypeScript rules
- Auto-import optimization with React Compiler

### Build Configuration

- Vite with React plugin
- Tailwind CSS integration
- Path resolution with alias support
- TypeScript compilation with `tsc -b`

## 🎯 Key Features Implementation

### Authentication & Authorization

- Context-based authentication state management
- Role-based module access control
- Secure session management with Supabase

### Form Handling

- React Hook Form for efficient form management
- Zod schema validation
- Custom form components with Radix UI

### Responsive Design

- Mobile-first approach with Tailwind CSS
- Adaptive layouts for different screen sizes
- Touch-friendly interface elements

### Data Visualization

- Recharts integration for dashboard analytics
- Real-time data updates
- Interactive charts and graphs

## 🔒 Security Considerations

- Environment variable protection for sensitive data
- Role-based access control implementation
- Input validation and sanitization
- Secure API communication with Supabase

## 📝 Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint configuration for code quality
- Component-based architecture
- Consistent naming conventions

### Commit Standards

Follow conventional commit format:

```
type(scope): description

Examples:
feat(patients): add patient registration
fix(payments): resolve payment processing issue
docs(readme): update installation guide
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'feat: add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Open a Pull Request

## 📄 License

This project is private and proprietary to Vinmec Healthcare System.

## 🆘 Support

For technical support or questions:

- Contact the development team
- Check issue tracking system
- Review documentation in the wiki

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Variables for Production

Ensure all environment variables are properly configured:

- Supabase connection settings
- API endpoints
- Any third-party service credentials

### Performance Optimization

- Code splitting with dynamic imports
- Component lazy loading
- Image optimization
- Bundle size monitoring

---

- Email: lehuythangvnsao@gmail.com
  **Built with ❤️ for Vinmec Healthcare System**
