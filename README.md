# Bun1 Hotel Booking System - Backend API

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/5TpXTvuY)

## links about things

[frontend repo](https://github.com/2110503-CEDT68/se-project-fe-68-2-bun1remake)

 [backend repo](https://github.com/2110503-CEDT68/se-project-be-68-2-bun1remake)

 [figma design](https://www.figma.com/design/FOVMAuZAGjeZSyWGNUM806/Bun1?node-id=0-1&t=xa5Cymb0i3PlCcga-1)

 [sprint backlog](https://docs.google.com/spreadsheets/d/18_tcmjDmkCqRyGTglJqvmr61rYwpZIbMA3imKUonaDg/edit?gid=1450166725#gid=1450166725)

## Project Overview

A comprehensive RESTful API for a hotel booking system built with **Node.js, Express, and MongoDB**. The system allows users to register, login, search for hotels, and manage bookings, while admins can manage all bookings and hotel information.

## Tech Stack

- **Runtime:** Node.js (Bun compatible)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Testing:** Postman/Newman
- **Environment:** .env configuration

---

## Project Structure

```
be-project-68-bun1/
├── config/
│   ├── db.js              # Database connection
│   └── config.env         # Environment variables
├── controllers/
│   ├── Auth.js            # Authentication logic
│   ├── Hotels.js          # Hotel CRUD operations
│   └── bookings.js        # Booking management
├── models/
│   ├── User.js            # User schema
│   ├── Hotel.js           # Hotel schema
│   └── booking.js         # Booking schema
│   └── comments.js        # Comments schema (NEW)
├── routes/
│   ├── auth.js            # Auth endpoints
│   ├── Hotel.js           # Hotel endpoints
│   └── bookings.js        # Booking endpoints
├── middleware/
│   └── auth.js            # JWT verification & role authorization
├── Bun1.postman_collection.json  # API test suite
├── env.json               # Postman environment
├── server.js              # Entry point
├── package.json           # Dependencies
└── README.md              # This file
```

---

## API Endpoints

### **Auth Endpoints**

| Method | Endpoint | Description | Auth |
| -------- | ---------- | ------------- | ------ |
| POST | `/api/v1/auth/register` | Start registration and send OTP email | No |
| POST | `/api/v1/auth/register/initiate` | Start registration and send OTP email | No |
| POST | `/api/v1/auth/verify-otp` | Verify OTP and activate account | No |
| POST | `/api/v1/auth/resend-otp` | Resend OTP for pending account | No |
| POST | `/api/v1/auth/login` | Login user | No |
| GET | `/api/v1/auth/me` | Get current user profile | Yes |
| GET | `/api/v1/auth/logout` | Logout user | Yes |
| PUT | `/api/v1/auth/users/:id/role` | Promote user to admin | Admin |

### **Hotel Endpoints**

| Method | Endpoint | Description | Auth |
| -------- | ---------- | ------------- | ------ |
| GET | `/api/v1/hotels` | Get all hotels (with search) | No |
| GET | `/api/v1/hotels/:id` | Get single hotel | No |
| POST | `/api/v1/hotels` | Create hotel | Admin |
| PUT | `/api/v1/hotels/:id` | Update hotel | Admin |
| DELETE | `/api/v1/hotels/:id` | Delete hotel | Admin |

### **Booking Endpoints**

| Method | Endpoint | Description | Auth |
| -------- | ---------- | ------------- | ------ |
| GET | `/api/v1/bookings` | Get user bookings (admin: all) | Yes |
| GET | `/api/v1/bookings/:id` | Get single booking | Yes |
| POST | `/api/v1/hotels/:hotelId/bookings` | Create booking | Yes |
| PUT | `/api/v1/bookings/:id` | Update booking | Yes |
| DELETE | `/api/v1/bookings/:id` | Delete booking | Yes |
| GET | `/api/v1/hotels/:hotelId/bookings` | Get bookings by hotel | Admin |

---

## Example Requests

  Please look at /models folder

---

## Developer Notes

### Making Changes

1. Commit frequently with clear messages
2. Use feature branches for new developments

