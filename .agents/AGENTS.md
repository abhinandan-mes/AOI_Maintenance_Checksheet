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

## CSS Architecture
* **Strict Vanilla CSS**: This project relies strictly on pure Vanilla CSS. Tailwind CSS utility classes are NOT compiled and will fail to render if used. All premium UI components must be implemented using custom `.css` classes.
