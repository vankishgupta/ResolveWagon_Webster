# 🧩 Resolve Wagon

> A centralized grievance tracking system built for the **Circus of Wonders**, enabling citizens to report issues, track progress, and ensure timely resolution through smart automation.

---

## 🚀 Project Overview

**Resolve Wagon** is a complaint management platform that ensures all grievances are logged, tracked, and resolved efficiently. Citizens, staff, and admins interact through a streamlined portal that ensures transparency and accountability.

---


## 🧠 Problem Description

The **Circus of Wonders** faces recurring issues like broken pathways, leaking caravans, or waste accumulation. Complaints often get lost in communication.  
**Resolve Wagon** centralizes complaint handling, assigning every report to staff and allowing citizens to track progress in real time — ensuring order within the chaos.

---

## ⚙️ Process Flow

### 1. User Authentication
- Role-based access: **Citizen**, **Staff**, **Admin**
- Secure JWT-based login

### 2. Complaint Submission
- Citizens can file complaints with:
  - Description  
  - Category  
  - Photo upload  
  - GPS location pin  

### 3. Complaint Lifecycle
- Status: **Open → In Progress → Resolved**
- Staff can update notes and change status

### 4. Reports & Analytics
- CSV exports  
---

## 🧰 Tech Stack

**Frontend:**
- React.js  
- Tailwind CSS  
- Axios (API calls)

**Backend:**
- Node.js + Express.js  
- MongoDB + Mongoose  
- Multer (image uploads)
- json2csv (CSV report generation)
- JWT + bcrypt.js (auth & security)

---

## 🏗️ Folder Structure


## ⚡ Setup & Installation

### Prerequisites
- Node.js and npm installed
- MongoDB instance (local or cloud)

### Steps

```bash

# Clone repository
git clone https://github.com/DakshParekh27/ResolveWagon_Webster.git

# Go into project directory
cd ResolveWagon_Webster

# Install dependencies
npm install

# Run backend (if separate)
cd Backend
npm install
npm start

# Run frontend
cd ..
npm run dev


🔒 Environment Variables

Create a .env file inside /Backend:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_URL=your_cloudinary_url
EMAIL_USER=your_email
EMAIL_PASS=your_email_password

📊 Future Enhancements

AI-based complaint categorization

Push notifications

Advanced analytics dashboards

Role-based statistics export

🌐 Live Demo
🚀 Live Applications
Platform	Live URL	Status
Frontend Application	https://resolve-wagon-webster.vercel.app	✅ Live
Backend API	https://resolve-wagon-webster-j9c3.vercel.app	✅ Live





