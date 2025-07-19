# 🛠️ Project Management Tool

A **modern, full-stack project management web app** built with **React.js**, **Node.js**, and **MongoDB/PostgreSQL**. Designed with a clean UI, responsive design, and rich functionality like dashboard analytics, team collaboration, task tracking, authentication, and more.


<img width="1357" height="634" alt="{FB51EE6F-5064-47FA-88FF-54FF1F643A53}" src="https://github.com/user-attachments/assets/49472f78-ea9c-47cb-a8b9-250091b38733" />


> Built with ❤️ by [Ajay Dhangar](https://github.com/ajay-dhangar)

---

## 🚀 Tech Stack

| Layer       | Tech                                 |
|-------------|--------------------------------------|
| **Frontend**| React.js, React Router, Context API / Redux |
| **Backend** | Node.js, Express.js                  |
| **Database**| MongoDB (Mongoose) / PostgreSQL (Prisma) |
| **Styling** | Tailwind CSS / Styled Components     |
| **UI/UX**   | Dark/Light Theme, Framer Motion      |
| **Build**   | Vite                                 |
| **Extras**  | Chart.js / Recharts, JWT, Toastify   |

---

## 🧩 Features Overview

### 🏠 Dashboard
- Personalized user dashboard
- Overview of active projects, tasks, and deadlines
- Visual data with charts and progress bars
- Notification alerts

### 📁 Projects
- View list of all projects with status, due dates, and progress
- Create/Edit/Delete project entries
- Assign team members and set timelines

### ✅ Task Management
- Kanban-style board with task columns
- Task creation with priority, deadline, description
- Assign users, drag-and-drop tasks
- Optional comments, file attachments

### 📆 Calendar & Deadlines
- Task/project due date management
- Visual calendar integration (optional)
- Countdown to deadlines

### 🔐 Authentication & Roles
- JWT-based login/registration
- User roles: Admin, Manager, Contributor
- Protected routes and role-based access

### 👥 Team Collaboration
- Add multiple team members per project
- Track who is working on what
- Optional comments/chat on tasks

### 🎨 UI / UX
- Clean, professional dashboard layout
- Framer Motion animations
- Animated modals, dropdowns, and toasts
- Theme toggle (Dark/Light with saved preferences)

### 📱 Mobile Ready
- Fully responsive design
- Mobile-friendly menus and task controls

---

## 📂 Folder Structure (Frontend)

```
project-management-tool/
├── src/
│   ├── components/
│   │   ├── auth/             # Login/Register
│   │   ├── common/           # UI: Button, Modal, Spinner, etc.
│   │   ├── dashboard/        # Dashboard widgets
│   │   ├── layout/           # Header, Sidebar, Layout
│   │   ├── projects/         # Project components
│   │   └── tasks/            # Task Board, Cards, Modals
│   ├── context/              # AppContext (global state)
│   ├── data/                 # Mock/static data
│   ├── pages/                # All route-based pages
│   ├── types/                # TypeScript types/interfaces
│   ├── utils/                # Utility functions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css

```

---

## 💻 Getting Started (Local Dev)

### 🔧 Prerequisites
- Node.js v18+
- MongoDB / PostgreSQL running locally or via cloud (MongoDB Atlas, Supabase)
- Optional: Redis (for sessions), Cloudinary (for attachments)

### 📦 Setup Instructions

```bash
# 1. Clone the repo
git clone https://github.com/ajay-dhangar/project-management-tool.git
cd project-management-tool

# 2. Install frontend dependencies
npm install

# 3. Setup your .env files
cp .env.example .env

# 4. Start the frontend (Vite)
npm run dev
```


---

## 🌐 Live Demo (Coming Soon)

> Check back for a live demo link showcasing the app's features in action!

---

## 🔒 License

This project is licensed under the **MIT License**. Feel free to use and modify with proper attribution.

---

## 🙋‍♂️ About the Developer

**Ajay Dhangar**
Full-stack Web Developer | MERN Stack Enthusiast
📎 GitHub: [ajay-dhangar](https://github.com/ajay-dhangar)
🔗 LinkedIn: [linkedin.com/in/ajay-dhangar](https://www.linkedin.com/in/ajay-dhangar/)
🌐 Portfolio: [ajay-dhangar.github.io](https://ajay-dhangar.github.io)
