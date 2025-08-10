# 🚀 Comprehensive Campus Resources Management System

## 🎯 System Overview

This is a **complete campus resources management system** with all the features you requested:

### ✅ **User Account & Role Management**
- **Role-based login** (Admin / Lecturer / Student)
- **Password encryption** and security
- **User Profile Management** - Update profile picture, contact info, department
- **View booking history**

### ✅ **Access Control**
- **Role-based access** to modules
- **Admin sees all**, lecturers see teaching resources only
- **Students** have limited access

### ✅ **Resource Booking System**
- **Real-Time Booking Interface** with calendar-style availability checker
- **Book by date, time, and resource type**
- **Multi-Resource Booking** - Book multiple items (Lab + Projector)
- **Recurring Bookings** - Weekly classes/events auto-book over semester
- **Booking Confirmation Flow** - Review summary, submit request, automatic email confirmation
- **Auto-Conflict Detection** - Prevent double-booking, suggest alternate times
- **Booking Modification** - Edit/Cancel reservations, reschedule with new slot checking
- **Booking Approval Workflow** - Auto-approve or Admin approval required

### ✅ **Resource Management**
- **Resource Inventory Module** - Add/edit/delete resources
- **Categorized Resources** - Rooms, Labs, Equipment, Vehicles
- **Resource Availability Status** - Booked/Available/Under Maintenance
- **Maintenance Scheduling** - Mark resources for repair
- **QR Code/Barcode Integration** - Scan assets to check status

### ✅ **Communication & Notifications**
- **Email/SMS Notifications** - Booking confirmation, cancellation, reminders
- **In-System Notifications** - Alerts for schedule changes, admin announcements
- **Feedback on Booking** - Report issues, submit reviews

### ✅ **Reports & Analytics**
- **Booking History Reports** - View by user, resource, department
- **Resource Utilization Dashboard** - Usage statistics, peak times
- **Conflict Report Generator** - Denied requests analysis
- **Maintenance Logs** - Equipment issues, downtime analysis

### ✅ **Security & Logs**
- **Audit Trail** - Log every action
- **User Access Logs** - Login timestamps, failed login alerts
- **Data Backup & Recovery** - Cloud backup of all records

## 📋 Firebase Setup Instructions

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "campus-resources-system"
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

### 3. Enable Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select a location (choose closest to you)
5. Click "Done"

### 4. Enable Storage
1. In Firebase Console, go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Select a location
5. Click "Done"

### 5. Get Your Firebase Config
1. In Firebase Console, click the gear icon ⚙️
2. Select "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>`
5. Register your app with name "Campus Resources"
6. Copy the config object

### 6. Update Firebase Config
Replace the config in `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 7. Set Up Firestore Security Rules
In Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins can read/write all data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Lecturers can read resources and manage their bookings
    match /resources/{resourceId} {
      allow read: if request.auth != null;
    }
    
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### 8. Set Up Storage Rules
In Firebase Console > Storage > Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-pictures/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🚀 Start the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access the Application
Open `http://localhost:3000` in your browser

## 🎯 Features by Role

### 👑 **Admin Features**
- **Full system access**
- **Manage all resources** (add, edit, delete)
- **Approve/reject bookings**
- **View all user data**
- **Generate comprehensive reports**
- **System settings management**
- **Maintenance scheduling**
- **Audit trail access**

### 👨‍🏫 **Lecturer Features**
- **Book teaching resources** (classrooms, labs, equipment)
- **View booking history**
- **Manage profile information**
- **Receive notifications**
- **Report maintenance issues**
- **View resource availability**

### 👨‍🎓 **Student Features**
- **Book study spaces** (limited resources)
- **View personal booking history**
- **Manage profile**
- **Receive notifications**
- **Report issues**

## 📊 Database Collections

### Users Collection
```javascript
{
  id: "user_id",
  username: "john_doe",
  email: "john@university.edu",
  role: "lecturer", // admin, lecturer, student
  department: "computer-science",
  profilePicture: "url",
  contactInfo: {
    phone: "+1234567890",
    office: "Room 101"
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  lastLogin: "2024-01-01T00:00:00Z"
}
```

### Resources Collection
```javascript
{
  id: "resource_id",
  name: "Computer Lab A",
  type: "lab", // room, lab, equipment, vehicle
  category: "Computer Labs",
  location: "Building A, Floor 2",
  capacity: 30,
  description: "Fully equipped computer lab",
  status: "available", // available, booked, maintenance, unavailable
  features: ["Projector", "Whiteboard", "Computers"],
  qrCode: "qr_code_data",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

### Bookings Collection
```javascript
{
  id: "booking_id",
  resourceId: "resource_id",
  resourceName: "Computer Lab A",
  userId: "user_id",
  userName: "John Doe",
  userRole: "lecturer",
  startTime: "2024-01-01T09:00:00Z",
  endTime: "2024-01-01T11:00:00Z",
  purpose: "Programming Class",
  attendees: 25,
  status: "approved", // pending, approved, rejected, cancelled
  approvedBy: "admin_id",
  approvedAt: "2024-01-01T08:00:00Z",
  isRecurring: true,
  recurringPattern: {
    frequency: "weekly",
    interval: 1,
    endDate: "2024-05-01T00:00:00Z"
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

## 🔧 System Settings

### Default Settings
```javascript
{
  maxBookingDuration: 4, // hours
  maxBookingsPerUser: 10,
  approvalRequired: true,
  blackoutDates: ["2024-12-25", "2024-01-01"],
  maintenanceMode: false,
  emailNotifications: true,
  smsNotifications: false
}
```

## 🎯 Next Steps

1. **Set up Firebase** following the instructions above
2. **Update the Firebase config** in `src/config/firebase.ts`
3. **Start the application** with `npm run dev`
4. **Register as an admin** to access all features
5. **Add resources** through the admin dashboard
6. **Test booking functionality** with different user roles

## 🆘 Troubleshooting

### Common Issues:
- **Firebase connection errors**: Check your config in `src/config/firebase.ts`
- **Permission denied**: Verify Firestore security rules
- **Storage upload fails**: Check Storage rules
- **Authentication issues**: Ensure Email/Password is enabled in Firebase

### Support:
- Check Firebase Console for error logs
- Verify all collections are created properly
- Test with different user roles

This system provides **everything you requested** with a modern, scalable architecture using Firebase as the backend! 