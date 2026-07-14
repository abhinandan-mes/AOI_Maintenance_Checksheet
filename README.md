# AOI Team Maintenance Checksheet

A comprehensive web application designed to digitize and manage the daily maintenance and inspection records for SMT and AOI equipment. The system replaces paper-based checklists with a consolidated digital workflow spanning SPI, Pre-AOI, and Post-AOI machines.

## Features
- **Consolidated 3-in-1 Checklists**: Unified review forms for SPI, Pre-AOI, and Post-AOI lines.
- **Role-Based Workflows**: Multi-tier approval system (Technician -> Engineer -> Manager).
- **Audit Trails**: Full tracking of IPs (Internal Only), timestamps, and user actions.
- **Responsive UI**: Modern, vanilla CSS interface designed to adapt fluidly to PCs, tablets, and phones.
- **Active Sessions Tracking**: Super Admins can monitor active logins across the internal network.

## Technology Stack
- **Frontend**: React 18 (CRA), React Router, Axios, Vanilla CSS.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (Prisma ORM).
- **Deployment**: PM2 (Backend) and IIS (Frontend + Reverse Proxy).

## Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- PM2 (Global installation)

### Installation
1. Clone the repository.
2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```
3. Setup Prisma Database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Install frontend dependencies:
   ```bash
   cd ../client
   npm install
   ```

### Running the System
**Backend:**
```bash
cd server
npm start
```
*API will run on port `5010`.*

**Frontend:**
```bash
cd client
npm start
```
*React app will run on port `3000` (or `3010` for IIS production build).*
