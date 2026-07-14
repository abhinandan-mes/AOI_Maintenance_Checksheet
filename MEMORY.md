# 🧠 Project Memory: AOI Team Maintenance Checksheet

This document serves as the project memory and system documentation for the **AOI Team Maintenance Checksheet** (AOI 团队设备保养记录). It provides context about the application's architecture, data model, backend API, frontend components, and deployment specifics for future developer sessions.

---

## 🚀 Project Overview
**AOI Team Maintenance Checksheet** is a comprehensive web application designed to digitize and manage the maintenance and inspection records for SMT/AOI equipment lines. It enables technicians, engineers, and managers to efficiently track the health of SPI, Pre-AOI, and Post-AOI machines through consolidated digital checklists.

---

## 💻 Tech Stack
- **Frontend**: React 18, React Router DOM (v6), Axios for API communication, and strict Vanilla CSS3 (with premium modern UI aesthetics, no Tailwind).
- **Backend**: Node.js & Express.js running via PM2 (`aoi-backend`).
- **Database**: PostgreSQL managed via Prisma ORM.
- **Security**: JWT-based authentication, bcrypt password hashing, and active IP tracking for audit logs.
- **Deployment Server**: Internet Information Services (IIS) on Windows, acting as a reverse proxy for the Node backend.

---

## 🔑 User Roles & Permissions
- **Super Admin & Admin**: Full system access, User Management capabilities, can view client IP addresses in logs.
- **Manager**: Can manage system users (create/edit/delete users up to the `manager` role only), fill checksheets, and provide final approval for engineer-approved records.
- **Engineer**: Can fill checksheets and approve/disapprove technician submissions.
- **Technician**: Fills out and submits checksheet records. Disapproved checksheets are routed back here for editing.
- **Inspector**: Strictly Read-only access. Blocked from creating, editing, or approving records.

---

## 🎨 UI & Design Principles
- **Consolidated Forms**: SPI, Pre-AOI, and Post-AOI checklists for the same line and date are grouped into a unified **3-in-1 consolidated review form**.
- **Excel-Style Checklists**: Completed checksheets in the Reports view render as clean, structured table grids matching physical inspection list layouts.
- **Responsive Layout**: Designed to natively fit the screen width (`max-width: 100%`) using Flexbox and Grid, seamlessly adapting to desktop monitors (1080p+), tablets, and phones without artificial downsizing.
- **Modern Aesthetics**: Utilizes zero borders, soft drop shadows, rounded corners (8px-16px), scale hover effects, dim background modal overlays, and a unified status color system (Green for Approved, Purple for Pending Manager, Orange for Pending Engineer, Red for Disapproved).

---

## 🌐 Deployment Details
- **Frontend Server**: Hosted via IIS on port `3010`.
- **Backend Server**: Node.js API running locally on port `5010`.
- **API Proxy**: IIS URL Rewrite is configured (`web.config`) to transparently proxy all requests matching `^api/(.*)` to `http://localhost:5010/api/{R:1}`.
- **Environment**: Internal enterprise network (`10.172.x.x`). The backend intelligently strips appended IIS proxy ports from the `X-Forwarded-For` headers to maintain clean IP logging.
