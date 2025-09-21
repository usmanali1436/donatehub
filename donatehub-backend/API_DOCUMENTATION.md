# DonateHub Backend API Documentation

## Overview
Complete backend implementation for DonateHub - Charity & Donation Management System with JWT-based authentication, role-based access control, and comprehensive campaign & donation management features.

**Server URL:** `http://localhost:3001/api/v1`

## 🔑 Core Features Implemented

### Authentication & Roles
- JWT-based login/signup system
- Role-based access control (NGO and Donor roles)
- Secure password hashing with bcrypt
- Token refresh mechanism

### NGO Features
- Create, edit, delete campaigns
- Campaign management dashboard
- View donations received
- Campaign performance analytics

### Donor Features
- Browse campaigns with filters
- Make donations (mock implementation)
- Personal donation history dashboard
- Track supported campaigns

### Campaign Management
- Progress bar calculations
- Advanced filtering and search
- Category-based organization
- Status management (active/closed)

### Dashboards
- NGO Dashboard: campaigns + donations received
- Donor Dashboard: donation history + supported campaigns
- General statistics endpoint

## 📚 API Endpoints

### Authentication Routes (`/users`)

#### Register User
```
POST /api/v1/users/register
Body: {
  "username": "string",
  "email": "string", 
  "fullName": "string",
  "password": "string",
  "role": "ngo" | "donor" (optional, defaults to "donor")
}
```

#### Verify User
```
POST /api/v1/users/verify
Body: {
  "username": "string",
  "code": "string"
}
```

#### Login User
```
POST /api/v1/users/login
Body: {
  "username": "string", // or email
  "email": "string",    // or username  
  "password": "string"
}
```

#### Logout User
```
POST /api/v1/users/logout
Authorization: Bearer <token>
```

#### Get Current User
```
POST /api/v1/users/current-user
Authorization: Bearer <token>
```

#### Update User Details
```
POST /api/v1/users/update-details
Authorization: Bearer <token>
Body: {
  "fullName": "string"
}
```

#### Change Password
```
POST /api/v1/users/change-password
Authorization: Bearer <token>
Body: {
  "oldPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

### Campaign Routes (`/campaigns`)

#### Get All Campaigns (Public)
```
GET /api/v1/campaigns
Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- category: "health" | "education" | "disaster" | "others" | "all"
- search: string (searches title and description)
- status: "active" | "closed" | "all" (default: "active")
- sortBy: "createdAt" | "title" | "goalAmount" | "raisedAmount"
- sortOrder: "asc" | "desc" (default: "desc")
```

#### Get Campaign Categories (Public)
```
GET /api/v1/campaigns/categories
Returns categories with statistics
```

#### Get Campaign by ID (Public)
```
GET /api/v1/campaigns/:campaignId
```

#### Create Campaign (NGO Only)
```
POST /api/v1/campaigns/create
Authorization: Bearer <token>
Body: {
  "title": "string",
  "description": "string",
  "category": "health" | "education" | "disaster" | "others",
  "goalAmount": number
}
```

#### Update Campaign (NGO Only - Own Campaigns)
```
PUT /api/v1/campaigns/:campaignId
Authorization: Bearer <token>
Body: {
  "title": "string",
  "description": "string", 
  "category": "health" | "education" | "disaster" | "others",
  "goalAmount": number,
  "status": "active" | "closed"
}
```

#### Delete Campaign (NGO Only - Own Campaigns)
```
DELETE /api/v1/campaigns/:campaignId
Authorization: Bearer <token>
Note: Cannot delete campaigns that have received donations
```

#### Get My Campaigns (NGO Only)
```
GET /api/v1/campaigns/my-campaigns
Authorization: Bearer <token>
Query Parameters:
- page: number
- limit: number
- status: "active" | "closed" | "all"
```

### Donation Routes (`/donations`)

#### Make Donation (Donor Only)
```
POST /api/v1/donations/donate
Authorization: Bearer <token>
Body: {
  "campaignId": "string",
  "amount": number
}
```

#### Get Donation History (Donor Only)
```
GET /api/v1/donations/history
Authorization: Bearer <token>
Query Parameters:
- page: number
- limit: number
- sortBy: "donatedAt" | "amount"
- sortOrder: "asc" | "desc"
```

#### Get Supported Campaigns (Donor Only)
```
GET /api/v1/donations/supported-campaigns
Authorization: Bearer <token>
Query Parameters:
- page: number
- limit: number
- status: "active" | "closed"
```

#### Get Campaign Donations (NGO: Own Campaigns, Donor: Any Campaign)
```
GET /api/v1/donations/campaign/:campaignId
Authorization: Bearer <token>
Query Parameters:
- page: number
- limit: number
```

#### Get Donation by ID
```
GET /api/v1/donations/:donationId
Authorization: Bearer <token>
Note: Can only view own donations or donations to own campaigns
```

### Dashboard Routes (`/dashboard`)

#### NGO Dashboard (NGO Only)
```
GET /api/v1/dashboard/ngo
Authorization: Bearer <token>
Returns:
- Overall statistics
- Recent campaigns
- Campaign performance
- Monthly donation trends
```

#### Donor Dashboard (Donor Only)
```
GET /api/v1/dashboard/donor  
Authorization: Bearer <token>
Returns:
- Donation statistics
- Recent donations
- Supported campaigns
- Donations by category
- Monthly donation history
- Impact statistics
```

#### General Statistics (Public)
```
GET /api/v1/dashboard/stats
Returns:
- Total users, NGOs, donors
- Campaign statistics
- Donation statistics
- Category breakdown
```

## 🛡️ Security Features

### JWT Authentication
- Access tokens (1 hour expiry)
- Refresh tokens (7 days expiry)
- Secure HTTP-only cookies
- Token verification middleware

### Role-Based Access Control
- NGO role: Can create, manage campaigns, view donations received
- Donor role: Can browse campaigns, make donations, view donation history
- Middleware for role verification

### Data Validation
- Input validation for all endpoints
- MongoDB schema validation
- Error handling with proper HTTP status codes

## 📊 Database Models

### User Model
```javascript
{
  username: String (unique, required),
  fullName: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  role: "ngo" | "donor" (default: "donor"),
  isVerified: Boolean (default: false),
  verifyCode: String,
  verifyCodeExpiry: Date,
  refreshToken: String,
  timestamps: true
}
```

### Campaign Model
```javascript
{
  title: String (required),
  description: String (required), 
  category: "health" | "education" | "disaster" | "others" (required),
  goalAmount: Number (required, min: 1),
  raisedAmount: Number (default: 0),
  createdBy: ObjectId (ref: User, required),
  status: "active" | "closed" (default: "active"),
  timestamps: true
}
```

### Donation Model
```javascript
{
  donorId: ObjectId (ref: User, required),
  campaignId: ObjectId (ref: Campaign, required),
  amount: Number (required, min: 1),
  donatedAt: Date (default: Date.now),
  timestamps: true
}
```

## 🔧 Utility Features

### Search & Filter Utilities
- Advanced search across title and description
- Category filtering
- Status filtering  
- Date range filtering
- Amount range filtering
- Flexible sorting options
- Pagination with metadata

### Progress Tracking
- Automatic progress percentage calculation
- Goal achievement status
- Real-time raised amount updates
- Campaign performance metrics

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env` and configure:
   - MongoDB connection string
   - JWT secrets
   - Port configuration
   - Email settings (optional)

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3001`

4. **Test Health Check**
   ```
   GET /api/v1/health-check
   ```

## 📝 Response Format

### Success Response
```javascript
{
  "statusCode": number,
  "data": object | array,
  "message": "string",
  "success": true
}
```

### Error Response  
```javascript
{
  "statusCode": number,
  "message": "string", 
  "success": false,
  "errors": array (optional)
}
```

## 🎯 Key Features Highlights

- **Complete Authentication System**: Registration, verification, login, logout, password change
- **Role-Based Permissions**: Separate functionality for NGOs and Donors
- **Advanced Campaign Management**: CRUD operations with rich filtering and search
- **Comprehensive Donation System**: Secure donation processing with history tracking
- **Rich Dashboard Analytics**: Separate dashboards for NGOs and Donors with statistics
- **Real-time Progress Tracking**: Automatic campaign progress calculations
- **Robust Search & Filter**: Multiple search criteria with pagination
- **Transaction Safety**: Database transactions for donation processing
- **Security Best Practices**: JWT authentication, password hashing, input validation

All endpoints include proper error handling, validation, and follow RESTful conventions.