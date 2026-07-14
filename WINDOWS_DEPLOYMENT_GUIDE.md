# Windows Server Deployment Guide

Hosting this React + Node.js (Express) + PostgreSQL application on a Windows Server requires setting up a web server for the frontend, a process manager for the backend, and a database instance.

## System Requirements

Before you begin, ensure your Windows Server (2019/2022) has the following installed:
1. **Node.js**: (LTS version, e.g., v20.x) - [Download](https://nodejs.org/)
2. **Git for Windows**: [Download](https://git-scm.com/download/win)
3. **PostgreSQL**: [Download](https://www.postgresql.org/download/windows/)
4. **IIS (Internet Information Services)**: Built into Windows Server (needs to be enabled via Server Manager).
5. **URL Rewrite Module for IIS**: [Download](https://www.iis.net/downloads/microsoft/url-rewrite) (Required for React routing and reverse proxy).

---

## Step 1: Clone the Repository
Open PowerShell or Command Prompt as Administrator:
```cmd
cd C:\inetpub\wwwroot
git clone https://github.com/abhinandan-mes/AOI_Maintenance_Checksheet.git
cd AOI_Maintenance_Checksheet
```

---

## Step 2: Setup the Database (PostgreSQL)
1. Open pgAdmin (installed with PostgreSQL).
2. Create a new database named `aoi_checksheet`.
3. Set up the `.env` file in your `server` directory:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/aoi_checksheet?schema=public"
PORT=5010
JWT_SECRET="your_very_secure_secret_key"
NODE_ENV="production"
```

---

## Step 3: Configure and Start the Backend
Navigate to the server directory and install dependencies:
```cmd
cd server
npm install
```

Push the database schema using Prisma:
```cmd
npx prisma db push
npx prisma generate
```

Install **PM2** globally to keep the Node.js server running in the background:
```cmd
npm install -g pm2
npm install -g pm2-windows-startup
```

Start the backend API using PM2:
```cmd
pm2 start server.js --name "aoi-backend"
pm2 save
pm2-startup install
```
*Your backend API is now permanently running on `http://localhost:5010`.*

---

## Step 4: Build the Frontend
Open a new terminal window, navigate to the client folder, and build the React app for production:
```cmd
cd C:\inetpub\wwwroot\AOI_Maintenance_Checksheet\client
npm install
npm run build
```
This creates a `build` folder containing the optimized production application.

---

## Step 5: Configure IIS (Frontend & Reverse Proxy)

### 1. Enable IIS and URL Rewrite
1. Open **Server Manager** -> **Add Roles and Features**.
2. Select **Web Server (IIS)**.
3. Install the **URL Rewrite** module using the link provided in the requirements.

### 2. Create the Site in IIS
1. Open **Internet Information Services (IIS) Manager**.
2. Right-click **Sites** -> **Add Website**.
3. **Site name**: `AOI_Checksheet`
4. **Physical path**: `C:\inetpub\wwwroot\AOI_Maintenance_Checksheet\client\build`
5. **Binding**: Port `80` (or `3010` if 80 is taken).
6. Click **OK**.

### 3. Setup Routing and API Proxy (web.config)
To make React routing work and to forward `/api` requests to your Node.js backend, create a file named `web.config` inside your `client/build` directory with the following content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Reverse Proxy for API requests to Node.js -->
        <rule name="ReverseProxyToAPI" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:5010/api/{R:1}" />
        </rule>

        <!-- React Router fallback (so refresh doesn't break) -->
        <rule name="ReactRouter Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

> [!NOTE]
> Make sure **Application Request Routing (ARR)** is enabled in IIS to allow the Reverse Proxy rule to function. (Open IIS Manager -> Application Request Routing Cache -> Server Proxy Settings -> Check "Enable proxy").

---

## Step 6: Firewall Configuration
If you hosted the IIS site on Port 80, you need to open it in Windows Firewall so other devices on the factory floor can access it:
1. Open **Windows Defender Firewall with Advanced Security**.
2. Click **Inbound Rules** -> **New Rule**.
3. Select **Port** -> **TCP** -> Specific local ports: `80` (or `3010`).
4. Allow the connection, name it "AOI Checksheet Web", and save.

Your application is now fully deployed and accessible from any device on your local network using the Windows Server's IP address (e.g., `http://192.168.1.XX`)!
