# Verticx ERP

Verticx ERP is a comprehensive, multi-branch ERP application designed for educational institutions. It features a sophisticated multi-portal architecture, providing tailored experiences for Admins, Principals, Registrars, Teachers, Students, and Parents. The application leverages AI for insightful analytics and provides a visually rich, responsive interface for managing all aspects of school operations.

## ✨ Key Features

- **Multi-Portal Architecture**: Dedicated, role-based portals for all key stakeholders in an educational ecosystem.
- **AI-Powered Analytics**: Integrates Google's Gemini API to provide principals with deep, actionable insights into school performance.
- **Comprehensive School Management**: End-to-end modules for managing students, faculty, classes, fees, attendance, timetables, and more.
- **Role-Based Access Control (RBAC)**: A fine-grained permission system, managed by the Admin, to enable or disable specific features for each portal.
- **Interactive Dashboards**: Each role gets a unique dashboard with at-a-glance statistics, charts, and quick actions relevant to their responsibilities.
- **Real-time Communication Hub**: Tools for sending announcements, SMS, and notifications to targeted groups across one or all school branches.
- **In-Browser Database**: Utilizes a sophisticated mock database system that runs directly in the browser using `localStorage` for data persistence across sessions.

## 🚀 Technology Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Charting**: Recharts
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Setup**: No-build configuration using modern browser features like `importmap`.

## 🏛️ Portal Overviews

-   **Admin Portal**: Provides system-wide oversight. Manages school branches, approves new registrations, controls user access, views aggregate financial and academic analytics, and uses the communication hub to broadcast messages.
-   **Principal Portal**: Offers a dashboard for a single school branch. Key features include academic performance monitoring, financial overviews, faculty management, student discipline, and generating AI-powered performance analyses.
-   **Registrar Portal**: The operational core of a school. Manages admissions, student and faculty information systems (SIS/FIS), fee collection, timetable creation, library, transport, and other essential logistics.
-   **Teacher Portal**: Empowers educators with tools for managing their classes, marking attendance, maintaining a gradebook, creating quizzes, managing syllabus, and uploading course content.
-   **Student Portal**: A personalized hub for students to view their dashboard, check grades and attendance, submit assignments, take online quizzes, and access course materials.
-   **Parent Portal**: Allows parents to monitor their child's academic progress, view attendance records, track fee payments, and communicate with teachers.

## ⚙️ Getting Started

This project is configured to run directly in the browser without a build step.

### Prerequisites

1.  A modern web browser (e.g., Chrome, Firefox, Edge).
2.  A simple local HTTP server.
3.  An API key for Google Gemini.

### Running the Application

1.  **Set up the Environment**:
    The application requires a Google Gemini API key to be available as an environment variable. While this setup doesn't use a traditional `.env` file, the `process.env.API_KEY` is hardcoded to be read by the Gemini client. Ensure your local server environment can provide this variable or replace the placeholder in the code if necessary for local testing.

2.  **Serve the Project**:
    Navigate to the project's root directory and start a local web server. If you have Python installed, you can use:
    ```bash
    python -m http.server
    ```
    Alternatively, you can use a tool like the "Live Server" extension in VS Code.

3.  **Access the App**:
    Open your web browser and navigate to the local address provided by your server (e.g., `http://localhost:8000`).

## 🔑 Demo Credentials

The login page is pre-populated with demo credentials for quick access to each portal.

| Role      | User ID / Email                | Password       |
| :-------- | :----------------------------- | :------------- |
| Admin     | `admin@verticx.com`            | `admin123`     |
| Principal | `principal.north@verticx.com`  | `principal123` |
| Registrar | `VRTX-REG-001`                 | `registrar123` |
| Teacher   | `VRTX-TCH-001`                 | `teacher123`   |
| Student   | `VRTX-STU-0001`                | `student123`   |
| Parent    | `parent.sarah@verticx.com`     | `parent123`    |