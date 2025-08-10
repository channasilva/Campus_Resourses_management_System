# Campus Resources Management System

A modern, responsive web application for managing campus resources with user authentication. Built with React, TypeScript, and Tailwind CSS.

## Features

### Authentication
- **Login Page**: Modern login interface with email and password
- **Register Page**: Complete registration with username, email, role selection, and password confirmation
- **Form Validation**: Real-time validation with helpful error messages
- **Password Requirements**: Visual feedback for password strength
- **Social Login**: Google and Twitter integration (UI only)

### Modern UI/UX
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern Styling**: Clean, professional design with Tailwind CSS
- **Smooth Animations**: Fade-in and slide-up animations
- **Interactive Elements**: Hover effects, focus states, and loading indicators
- **Accessibility**: Proper ARIA labels and keyboard navigation

### User Roles
- **Student**: Access to student-specific features
- **Lecturer**: Access to lecturer-specific features

## Technology Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **ESLint** - Code linting

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campus-resources-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx     # Button component with variants
│   └── Input.tsx      # Input component with validation
├── pages/             # Page components
│   ├── LoginPage.tsx  # Login page
│   ├── RegisterPage.tsx # Registration page
│   └── Dashboard.tsx  # Dashboard after login
├── types/             # TypeScript type definitions
│   └── auth.ts        # Authentication types
├── utils/             # Utility functions
│   └── validation.ts  # Form validation utilities
├── App.tsx            # Main app component with routing
├── main.tsx           # React entry point
└── index.css          # Global styles and Tailwind imports
```

## Features in Detail

### Login Page
- Email and password authentication
- Remember me functionality
- Forgot password link
- Social login options (Google, Twitter)
- Form validation with real-time feedback
- Loading states during authentication

### Register Page
- Complete user registration form
- Username validation (3+ characters, alphanumeric + underscore)
- Email validation
- Role selection (Student/Lecturer)
- Password strength requirements:
  - Minimum 8 characters
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number
- Password confirmation matching
- Terms of service agreement
- Real-time password strength indicator

### Dashboard
- Welcome message with user's name
- User information cards (username, email, role, join date)
- Quick action buttons
- Logout functionality
- Responsive layout

## Customization

### Styling
The application uses Tailwind CSS with a custom color palette. You can modify the colors in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#eff6ff',
    // ... other shades
    900: '#1e3a8a',
  }
}
```

### Adding New Pages
1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Import and use the component

### Form Validation
Validation rules are defined in `src/utils/validation.ts`. You can modify or extend these rules as needed.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Demo

For demonstration purposes, the login accepts any valid email/password combination, and the registration creates a mock user account stored in localStorage.

### Test Credentials
- **Email**: `demo@example.com`
- **Password**: `Password123`

## Future Enhancements

- Backend API integration
- Real authentication with JWT
- Database integration
- User profile management
- Resource booking system
- Admin dashboard
- Email verification
- Password reset functionality
- Role-based access control
- Audit logging 