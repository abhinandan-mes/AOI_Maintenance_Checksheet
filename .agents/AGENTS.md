# SMT Equipment Maintenance Checksheet System Rules

## Layout & Brand
* The system brand name in the header and login page is **AOI Team Maintenance Checksheet** (or **AOI 团队保养检查表** in Chinese).
* The login title is **AOI Team Maintenance Records** (or **AOI 团队设备保养记录** in Chinese).

## User Roles & Permissions
* **Admin Role**: The admin role is removed from User Management creation and editing views.
* **Inspector Role**: The Inspector role has read-only access. Inspectors must be blocked from creating, editing, modifying, or reviewing/approving maintenance records.
* **Technician Role**: Technicians fill out and submit checksheet records. Disapproved checksheets are routed back to the technician for editing and resubmission.
* **Engineer Role**: Engineers can fill checksheets and approve/disapprove technician submissions.
* **Manager Role**: Managers can manage system users, fill checksheets, and approve/disapprove records (providing final approval for engineer-approved records).

## Layout & Navigation Structure
* **Pending Tasks Order**: The **Pending Tasks** (待办事项) tab/route must be positioned directly after **Home** (首页) and before **Maintenance Checksheet** (设备保养).
* **Excel-Style Checklist Tables**: completed checksheets inside the Reports view details must render as clean, structured table grids matching the Excel inspection list layout (Pass/Fail checkboxes) instead of vertical bullet lists.
* **Audit Trails & IP Logging**: All checksheet submissions, reassignments, and approval reviews must record and display the executor's username, full timestamp (date, hour, minute, second), and client IP address. **Security exception: The IP Address must be hidden from standard users (Technicians) and only visible to users with `admin`, `super_admin`, or `manager` roles.**
* **Action Buttons Design**: Action buttons (such as *Review*, *Edit & Submit*, *Modify*) must be designed with modern UI/UX aesthetics: zero borders, rounded corners (`border-radius: 8px`), soft drop shadows, and scale hover translate effects.
* **Unified Modals**: All pop-ups and modals (e.g., Bulk Reject) must be styled with a unified corporate UI, utilizing dim background overlays, slide-up animations, rounded corners, drop shadows, and clean cancel/confirm buttons.

## Visual Consolidation & Log Tables
* **3-in-1 Consolidated Review & Edit Form**: SPI, Pre-AOI, and Post-AOI checklists for the same line on a specific date must be grouped and rendered on a unified 3-in-1 form. Approval and rejection decisions must sign off or rollback all three machine records concurrently in a single operation.
* **Consolidated Pending & Reports Log Lists**: Pending tasks and Reports logs must group records by Line, Date, and Period into single checksheet entries. Equipment type, machine type, serial number, and asset number columns must be omitted from the main table, and instead rendered using a color-coded tabbed switcher (`[ SPI ]`, `[ Pre-AOI ]`, `[ Post-AOI ]`) inside the expanded details block.
* **Unified Status Color System**: Badges and indicators must share identical color-coding across Home, Pending, and Reports:
  * **APPROVED (已归档)**: Green (`background: #ecfdf5; color: #047857; border: 1px solid #d1fae5`)
  * **ENG_APPROVED (待经理审批)**: Purple (`background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe`)
  * **SUBMITTED (待审核)**: Orange (`background: #fffbeb; color: #b45309; border: 1px solid #fef3c7`)
  * **DISAPPROVED (被退回)**: Red (`background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2`)
* **Active Timeline Highlights**: Workflow timelines must highlight the currently active pending step (e.g. orange for pending engineer, purple for pending manager) instead of showing a flat gray marker.
* **Consolidated Homepage Activity Log**: The homepage activity log must group activities by Line, Period, User, Action, and time, displaying only a single line-wise row (omitting equipment type badges and specific machine listings).
* **Activity Log Details Modal**: The dedicated Activity Log page must include a "Details" (eye icon) action button that opens a comprehensive pop-up modal displaying the full event details (including specific machines and IP addresses). This modal utilizes `.global-modal-*` CSS classes defined in `ActivityLog.css`.


## Checksheet Form Layout (Excel-Style)
* **5-Column Excel Table Layout**: The maintenance checksheet form (`MaintenanceForm.js`) must render check items as a 5-column Excel-style grid table: `Cycle | Maintenance Check Content | First Month | Second Month | Third Month`. This replaces the old single-column vertical checkbox list. The rendering function is `renderExcelChecks()`.
* **Active vs Inactive Month Columns**: Only the currently selected period column (First/Second/Third Month) is interactive (coloured header, clickable checkboxes). The other two month columns are displayed greyed out as visual reference — not clickable.
* **Quarterly Section on Third Month Only**: When Third Month is selected, a Quarterly section appears below the monthly rows. It spans all three month columns. The First Month and Second Month quarterly cells show a greyed-out dash `—`. Only the Third Month quarterly column is active and interactive.
* **Unique Check Items Per Machine**: LASER machines have unique extra checks (m9: dust collector, m10: exhaust pipe) in addition to the standard 8 monthly checks. SPI, Pre-AOI, and Post-AOI use the standard 8 monthly checks. Each machine's checklist must remain unique — never homogenise them.
* **Monthly Remarks & Footer Rows**: Each month column must display a `Remarks:` row and a `Maintenance date / Personnel signature` footer row below the checklist, matching the physical Excel inspection sheet format.
* **CSS Classes**: All Excel table styles use `.excel-table-wrap`, `.excel-table-grid`, `.excel-th-*`, `.excel-cycle-cell`, `.excel-content-cell`, `.excel-month-cell`, `.excel-checkbox`, `.excel-quarterly-*` classes defined in `MaintenanceForm.css`. Never use Tailwind.

## Backend & Infrastructure
* **Backend Auto-Start (Windows Service)**: The Node.js Express backend (`D:\AOI_Maintenance_Checksheet-main\server\server.js`) runs as a native Windows Service named **"AOI Maintenance Backend"**, installed via `node-windows` using the script `server/install-service.js`. The backend starts at system boot without requiring any user login, and is managed via `services.msc`. **Do NOT use PM2 for this project's backend.**
* **Prisma Migrate Deploy Disabled on Startup**: The `execSync('npx prisma migrate deploy')` line in `server/config/schema.js` is permanently commented out. Running `prisma migrate deploy` on an already-populated production database throws Prisma error `P3005` and crashes the server. If new database migrations are ever needed, they must be run manually from the command line — never automatically on server boot.
* **Other Project Separation**: The other project (`D:\AOi_check_sheet`, port 5001) uses a completely separate auto-start mechanism — a Windows Startup Shortcut (`.lnk`) pointing to a hidden VBS launcher (`start-server-hidden.vbs`). The two projects are fully independent. Never add `AOi_check_sheet` to PM2 or this project's Windows Service.
* **Frontend Hosting**: The React frontend (`client/build`) is served by IIS on port 3010, which starts automatically as a Windows Service on system boot. No separate frontend process manager is needed.

## CSS Architecture
* **Strict Vanilla CSS**: This project relies strictly on pure Vanilla CSS. Tailwind CSS utility classes are NOT compiled and will fail to render if used. All premium UI components must be implemented using custom `.css` classes.

## Line Management
* **Line Management Page**: A dedicated `LineManagement.js` panel available exclusively to `super_admin` and `admin` roles, displaying interactive toggle cards for all 25 production lines (401–425).
* **Installed vs Not Installed**: Each line has an installation status toggle. Lines marked "Not Installed" are hidden from the Maintenance Checksheet line selection grid. Default not-installed lines: 409, 414, 416, 417, 418, 419, 420.
* **Database Model**: `LineStatus` model in Prisma schema (`line_status` table) with fields: `id`, `line` (unique), `is_installed` (boolean), `updated_by`, `updated_at`.
* **Backend**: Model in `server/models/LineStatus.js`, controller in `server/controllers/LineStatusController.js`, routes in `server/routes/lineStatus.js`. Lines are seeded on startup via `seedLines()` in `config/schema.js`.
* **API Endpoints**: `GET /api/lines` (all lines), `GET /api/lines/installed` (installed only), `PATCH /api/lines/:line` (admin/super_admin toggle).
* **Audit Trail**: Line status toggles are logged to `SystemEventLog` with event type `LINE_STATUS_UPDATE`.
* **Navigation Position**: Line Management tab is positioned after **Activity Log** and before **User Management** in the header nav bar.

## Version Control & Workflow
* **Branching Rule**: ALWAYS create a new git branch before making any code modifications instead of committing directly to the main branch.

