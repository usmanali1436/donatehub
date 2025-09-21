# DonateHub API Documentation

## Overview

The DonateHub API is a RESTful web service that enables donation management between NGOs and donors. The API supports user authentication, campaign management, donation processing, and dashboard analytics.

**Base URL:** `http://localhost:8000/api/v1`

## Authentication

Most endpoints require authentication using JWT tokens. Authentication is handled via cookies and/or Authorization headers.

### Authentication Headers
```
Authorization: Bearer <access_token>
Cookie: accessToken=<token>; refreshToken=<refresh_token>
```

## API Response Format

All API responses follow a consistent structure:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success message",
  "success": true
}
```

### Error Response Format
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error message",
  "success": false,
  "errors": []
}
```

## User Management

### 1. Register User
**POST** `/users/register`

Register a new user (NGO or Donor).

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "password": "securePassword123",
  "role": "donor"
}
```

**Response (201):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "donor",
    "createdAt": "2023-09-22T10:30:00.000Z",
    "updatedAt": "2023-09-22T10:30:00.000Z"
  },
  "message": "User details has been registered successfully.",
  "success": true
}
```

### 2. Login User
**POST** `/users/login`

Authenticate user and receive access tokens.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "donor"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User has been logged in successfully.",
  "success": true
}
```

### 3. Logout User
**POST** `/users/logout`

🔒 **Requires Authentication**

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "User logout successfully.",
  "success": true
}
```

### 4. Get Current User
**POST** `/users/current-user`

🔒 **Requires Authentication**

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "donor",
    "createdAt": "2023-09-22T10:30:00.000Z",
    "updatedAt": "2023-09-22T10:30:00.000Z"
  },
  "message": "User fetched successfully.",
  "success": true
}
```

### 5. Update User Details
**POST** `/users/update-details`

🔒 **Requires Authentication**

**Request Body:**
```json
{
  "fullName": "John Updated Doe"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Updated Doe",
    "role": "donor",
    "updatedAt": "2023-09-22T11:30:00.000Z"
  },
  "message": "User has been updated successfully.",
  "success": true
}
```

### 6. Change Password
**POST** `/users/change-password`

🔒 **Requires Authentication**

**Request Body:**
```json
{
  "oldPassword": "currentPassword123",
  "newPassword": "newSecurePassword456",
  "confirmPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password has been changed successfully.",
  "success": true
}
```

## Campaign Management

### 1. Get All Campaigns
**GET** `/campaigns`

Retrieve all campaigns with optional filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by category ("health", "education", "disaster", "others", "all")
- `search` (string): Search in title and description
- `status` (string): Filter by status ("active", "closed")
- `sortBy` (string): Sort field (default: "createdAt")
- `sortOrder` (string): Sort order ("asc", "desc") (default: "desc")

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "campaigns": [
      {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
        "title": "Help Build School in Rural Area",
        "description": "Building a school for underprivileged children...",
        "category": "education",
        "goalAmount": 50000,
        "raisedAmount": 25000,
        "status": "active",
        "creator": {
          "_id": "64f5a1b2c3d4e5f6a7b8c9d2",
          "fullName": "Education NGO",
          "username": "education_ngo"
        },
        "progressPercentage": 50,
        "isGoalReached": false,
        "createdAt": "2023-09-20T08:00:00.000Z",
        "updatedAt": "2023-09-22T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCampaigns": 50,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Campaigns fetched successfully",
  "success": true
}
```

### 2. Get Campaign by ID
**GET** `/campaigns/:campaignId`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
    "title": "Help Build School in Rural Area",
    "description": "Building a school for underprivileged children in remote areas...",
    "category": "education",
    "goalAmount": 50000,
    "raisedAmount": 25000,
    "status": "active",
    "createdBy": {
      "_id": "64f5a1b2c3d4e5f6a7b8c9d2",
      "fullName": "Education NGO",
      "username": "education_ngo",
      "email": "contact@education-ngo.org"
    },
    "progressPercentage": 50,
    "isGoalReached": false,
    "donationsCount": 25,
    "createdAt": "2023-09-20T08:00:00.000Z",
    "updatedAt": "2023-09-22T12:00:00.000Z"
  },
  "message": "Campaign fetched successfully",
  "success": true
}
```

### 3. Create Campaign
**POST** `/campaigns/create`

🔒 **Requires Authentication** (NGO only)

**Request Body:**
```json
{
  "title": "Help Build School in Rural Area",
  "description": "Building a school for underprivileged children in remote areas. We need funds for construction materials, labor, and educational supplies.",
  "category": "education",
  "goalAmount": 50000
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
    "title": "Help Build School in Rural Area",
    "description": "Building a school for underprivileged children...",
    "category": "education",
    "goalAmount": 50000,
    "raisedAmount": 0,
    "status": "active",
    "createdBy": {
      "_id": "64f5a1b2c3d4e5f6a7b8c9d2",
      "fullName": "Education NGO",
      "username": "education_ngo"
    },
    "createdAt": "2023-09-22T10:30:00.000Z",
    "updatedAt": "2023-09-22T10:30:00.000Z"
  },
  "message": "Campaign created successfully",
  "success": true
}
```

### 4. Update Campaign
**PUT** `/campaigns/:campaignId`

🔒 **Requires Authentication** (Campaign owner only)

**Request Body:**
```json
{
  "title": "Updated Campaign Title",
  "description": "Updated description",
  "category": "health",
  "goalAmount": 60000,
  "status": "active"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
    "title": "Updated Campaign Title",
    "description": "Updated description",
    "category": "health",
    "goalAmount": 60000,
    "raisedAmount": 25000,
    "status": "active",
    "createdBy": {
      "_id": "64f5a1b2c3d4e5f6a7b8c9d2",
      "fullName": "Education NGO",
      "username": "education_ngo"
    },
    "updatedAt": "2023-09-22T15:30:00.000Z"
  },
  "message": "Campaign updated successfully",
  "success": true
}
```

### 5. Delete Campaign
**DELETE** `/campaigns/:campaignId`

🔒 **Requires Authentication** (Campaign owner only)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Campaign deleted successfully",
  "success": true
}
```

### 6. Get My Campaigns
**GET** `/campaigns/my-campaigns`

🔒 **Requires Authentication** (NGO only)

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status ("active", "closed")

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "campaigns": [
      {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
        "title": "Help Build School in Rural Area",
        "description": "Building a school...",
        "category": "education",
        "goalAmount": 50000,
        "raisedAmount": 25000,
        "status": "active",
        "donationsCount": 25,
        "progressPercentage": 50,
        "isGoalReached": false,
        "createdAt": "2023-09-20T08:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCampaigns": 25,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Your campaigns fetched successfully",
  "success": true
}
```

### 7. Get Campaign Categories
**GET** `/campaigns/categories`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "name": "health",
      "count": 15,
      "totalRaised": 125000,
      "totalGoal": 200000
    },
    {
      "name": "education",
      "count": 20,
      "totalRaised": 85000,
      "totalGoal": 150000
    },
    {
      "name": "disaster",
      "count": 8,
      "totalRaised": 45000,
      "totalGoal": 80000
    },
    {
      "name": "others",
      "count": 5,
      "totalRaised": 20000,
      "totalGoal": 35000
    }
  ],
  "message": "Categories with statistics fetched successfully",
  "success": true
}
```

## Donation Management

### 1. Make Donation
**POST** `/donations/donate`

🔒 **Requires Authentication** (Donor only)

**Request Body:**
```json
{
  "campaignId": "64f5a1b2c3d4e5f6a7b8c9d1",
  "amount": 1000
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "_id": "64f5a1b2c3d4e5f6a7b8c9d3",
    "donorId": {
      "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
      "fullName": "John Doe",
      "username": "john_doe"
    },
    "campaignId": {
      "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
      "title": "Help Build School in Rural Area",
      "description": "Building a school for underprivileged children..."
    },
    "amount": 1000,
    "donatedAt": "2023-09-22T14:30:00.000Z",
    "createdAt": "2023-09-22T14:30:00.000Z",
    "updatedAt": "2023-09-22T14:30:00.000Z"
  },
  "message": "Donation made successfully",
  "success": true
}
```

### 2. Get Donation History
**GET** `/donations/history`

🔒 **Requires Authentication** (Donor only)

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `sortBy` (string): Sort field (default: "donatedAt")
- `sortOrder` (string): Sort order ("asc", "desc") (default: "desc")

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "donations": [
      {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d3",
        "amount": 1000,
        "donatedAt": "2023-09-22T14:30:00.000Z",
        "campaign": {
          "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
          "title": "Help Build School in Rural Area",
          "description": "Building a school...",
          "category": "education",
          "goalAmount": 50000,
          "raisedAmount": 26000,
          "status": "active"
        },
        "ngo": {
          "_id": "64f5a1b2c3d4e5f6a7b8c9d2",
          "fullName": "Education NGO",
          "username": "education_ngo"
        }
      }
    ],
    "stats": {
      "totalDonated": 5000,
      "campaignsSupported": 8
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalDonations": 15,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Donation history fetched successfully",
  "success": true
}
```

### 3. Get Campaign Donations
**GET** `/donations/campaign/:campaignId`

🔒 **Requires Authentication** (Campaign owner or any authenticated user)

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "donations": [
      {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d3",
        "amount": 1000,
        "donatedAt": "2023-09-22T14:30:00.000Z",
        "donor": {
          "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
          "fullName": "John Doe",
          "username": "john_doe"
        }
      }
    ],
    "stats": {
      "totalAmount": 25000,
      "totalDonors": 18,
      "avgDonation": 1388.89,
      "minDonation": 100,
      "maxDonation": 5000
    },
    "campaign": {
      "title": "Help Build School in Rural Area",
      "goalAmount": 50000,
      "raisedAmount": 25000,
      "progressPercentage": 50
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalDonations": 25,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Campaign donations fetched successfully",
  "success": true
}
```

### 4. Get Supported Campaigns
**GET** `/donations/supported-campaigns`

🔒 **Requires Authentication** (Donor only)

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by campaign status ("active", "closed", "all")

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "supportedCampaigns": [
      {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
        "totalDonated": 2500,
        "donationCount": 3,
        "lastDonation": "2023-09-22T14:30:00.000Z",
        "campaign": {
          "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
          "title": "Help Build School in Rural Area",
          "description": "Building a school...",
          "category": "education",
          "goalAmount": 50000,
          "raisedAmount": 26000,
          "status": "active",
          "progressPercentage": 52,
          "creator": {
            "_id": "64f5a1b2c3d4e5f6a7b8c9d2",
            "fullName": "Education NGO",
            "username": "education_ngo"
          }
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalCampaigns": 8,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Supported campaigns fetched successfully",
  "success": true
}
```

### 5. Get Donation by ID
**GET** `/donations/:donationId`

🔒 **Requires Authentication** (Donation owner or campaign owner)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "64f5a1b2c3d4e5f6a7b8c9d3",
    "donorId": {
      "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
      "fullName": "John Doe",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "campaignId": {
      "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
      "title": "Help Build School in Rural Area",
      "description": "Building a school...",
      "category": "education",
      "goalAmount": 50000,
      "raisedAmount": 26000,
      "status": "active",
      "createdBy": {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d2",
        "fullName": "Education NGO",
        "username": "education_ngo"
      }
    },
    "amount": 1000,
    "donatedAt": "2023-09-22T14:30:00.000Z",
    "createdAt": "2023-09-22T14:30:00.000Z",
    "updatedAt": "2023-09-22T14:30:00.000Z"
  },
  "message": "Donation details fetched successfully",
  "success": true
}
```

## Dashboard Analytics

### 1. Get NGO Dashboard
**GET** `/dashboard/ngo`

🔒 **Requires Authentication** (NGO only)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "overallStats": {
      "totalCampaigns": 5,
      "activeCampaigns": 3,
      "closedCampaigns": 2,
      "totalGoalAmount": 250000,
      "totalRaisedAmount": 125000,
      "totalDonations": 45,
      "totalDonationAmount": 125000,
      "uniqueDonors": 28,
      "avgDonation": 2777.78,
      "progressPercentage": 50
    },
    "recentCampaigns": [
      {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
        "title": "Help Build School in Rural Area",
        "goalAmount": 50000,
        "raisedAmount": 26000,
        "status": "active",
        "createdAt": "2023-09-20T08:00:00.000Z"
      }
    ],
    "campaignPerformance": [
      {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
        "title": "Help Build School in Rural Area",
        "goalAmount": 50000,
        "raisedAmount": 26000,
        "donationsCount": 18,
        "progressPercentage": 52.0,
        "status": "active",
        "createdAt": "2023-09-20T08:00:00.000Z"
      }
    ],
    "monthlyDonations": [
      {
        "_id": { "year": 2023, "month": 8 },
        "totalAmount": 15000,
        "totalDonations": 8
      },
      {
        "_id": { "year": 2023, "month": 9 },
        "totalAmount": 35000,
        "totalDonations": 20
      }
    ]
  },
  "message": "NGO dashboard data fetched successfully",
  "success": true
}
```

### 2. Get Donor Dashboard
**GET** `/dashboard/donor`

🔒 **Requires Authentication** (Donor only)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "stats": {
      "totalDonations": 15,
      "totalDonated": 5000,
      "avgDonation": 333.33,
      "campaignsSupported": 8,
      "campaignsHelpedComplete": 2,
      "activeCampaignsSupported": 6
    },
    "recentDonations": [
      {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d3",
        "amount": 1000,
        "donatedAt": "2023-09-22T14:30:00.000Z",
        "campaignId": {
          "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
          "title": "Help Build School in Rural Area",
          "description": "Building a school...",
          "category": "education",
          "status": "active"
        }
      }
    ],
    "supportedCampaigns": [
      {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
        "totalDonated": 2500,
        "donationCount": 3,
        "lastDonation": "2023-09-22T14:30:00.000Z",
        "campaign": {
          "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
          "title": "Help Build School in Rural Area",
          "description": "Building a school...",
          "category": "education",
          "goalAmount": 50000,
          "raisedAmount": 26000,
          "status": "active",
          "progressPercentage": 52,
          "creator": {
            "_id": "64f5a1b2c3d4e5f6a7b8c9d2",
            "fullName": "Education NGO",
            "username": "education_ngo"
          }
        }
      }
    ],
    "donationsByCategory": [
      {
        "_id": "education",
        "totalDonated": 2500,
        "donationCount": 8
      },
      {
        "_id": "health",
        "totalDonated": 1500,
        "donationCount": 4
      },
      {
        "_id": "disaster",
        "totalDonated": 1000,
        "donationCount": 3
      }
    ],
    "monthlyDonations": [
      {
        "_id": { "year": 2023, "month": 8 },
        "totalAmount": 2000,
        "totalDonations": 5
      },
      {
        "_id": { "year": 2023, "month": 9 },
        "totalAmount": 3000,
        "totalDonations": 10
      }
    ]
  },
  "message": "Donor dashboard data fetched successfully",
  "success": true
}
```

### 3. Get General Statistics
**GET** `/dashboard/stats`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "users": {
      "total": 150,
      "ngos": 25,
      "donors": 125
    },
    "campaigns": {
      "total": 48,
      "active": 35,
      "closed": 13,
      "totalGoal": 500000,
      "totalRaised": 275000
    },
    "donations": {
      "total": 320,
      "totalAmount": 275000,
      "avgAmount": 859
    },
    "categories": [
      {
        "_id": "health",
        "count": 15,
        "totalRaised": 125000,
        "totalGoal": 200000
      },
      {
        "_id": "education",
        "count": 20,
        "totalRaised": 85000,
        "totalGoal": 150000
      },
      {
        "_id": "disaster",
        "count": 8,
        "totalRaised": 45000,
        "totalGoal": 80000
      },
      {
        "_id": "others",
        "count": 5,
        "totalRaised": 20000,
        "totalGoal": 70000
      }
    ]
  },
  "message": "General statistics fetched successfully",
  "success": true
}
```

## Health Check

### Health Check Endpoint
**GET** `/health-check`

Check if the API is running properly.

**Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "App Working fine."
}
```

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String,
  fullName: String,
  email: String,
  password: String,
  role: String,
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Campaign Model
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  goalAmount: Number,
  raisedAmount: Number,
  createdBy: ObjectId,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Donation Model
```javascript
{
  _id: ObjectId,
  donorId: ObjectId,
  campaignId: ObjectId,
  amount: Number,
  donatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Security Features

- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- MongoDB injection protection through Mongoose
- HTTP-only cookies for token storage

---

*Last updated: September 22, 2025*