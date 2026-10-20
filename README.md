# DineFlow — Restaurant Management System

**🌐 Live Website:** https://dine-flow-restaurant-management.vercel.app/

**⚙️ Backend API:** https://dineflow-api-ul4a.onrender.com

**💚 API Health Check:** https://dineflow-api-ul4a.onrender.com/api/health

**📂 GitHub Repository:** https://github.com/anchalvns2006-del/DineFlow-Restaurant-Management

A full-stack restaurant management application built to manage menu items, customer orders, table reservations, ingredient inventory, and operational analytics from one dashboard.

## Features

- **Admin Authentication:** JWT-based login, bcrypt password hashing, and session verification.
- **Restaurant Dashboard:** Overview of menu items, orders, reservations, and low-stock ingredients.
- **Menu Management:** Browse menu items and their details.
- **Order & Kitchen Management:** Create orders and update kitchen order statuses.
- **Table Reservations:** Check table availability and prevent overlapping reservations.
- **Inventory Management:** Track ingredients, quantities, suppliers, costs, and reorder thresholds.
- **Automatic Inventory Deduction:** Deduct recipe ingredients when an order moves to preparation.
- **Inventory Movement Ledger:** Track ingredient consumption and stock changes.
- **Reports & Analytics:** View order counts, inventory valuation, revenue records, and popular dishes.
- **Responsive UI:** Interface designed for desktops and smaller screens.

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS
- Lucide React Icons

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs

**Deployment**
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## Project Structure

```text
DineFlow-Restaurant-Management/
├── client/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── Login.jsx
│       └── Login.css
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── scripts/
├── seed/
├── server.js
├── package.json
└── README.md
```

## Prerequisites

- Node.js 22 or a compatible recent version
- npm
- MongoDB database, such as MongoDB Atlas
- Git

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/anchalvns2006-del/DineFlow-Restaurant-Management.git
cd DineFlow-Restaurant-Management
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

Add your own environment values:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
```

Replace the example values with your actual configuration. Never commit real credentials, database connection strings, or secrets to GitHub.

### 4. Start the Backend

```bash
npm run dev
```

Backend URL: http://localhost:5000

Health check: http://localhost:5000/api/health

### 5. Install Frontend Dependencies

Open a second terminal:

```bash
cd client
npm install
```

Create a `client/.env.local` file:

```env
VITE_API_URL=http://localhost:5000
```

### 6. Start the Frontend

From the `client` directory, run:

```bash
npm run dev
```

Open the local URL displayed by Vite, typically:

http://localhost:5173

## Initial Admin Setup

To create the first administrator, run the setup script from the project root:

```bash
node scripts/createAdmin.js
```

Follow the prompts for the administrator's name, email, and password. Keep administrator credentials private and ensure the script targets the intended database.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/menu` | List menu items |
| GET | `/api/menu/:id` | Get a menu item |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Get the authenticated user |
| POST | `/api/auth/staff` | Create a staff account |
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create an order |
| PATCH | `/api/orders/:id/status` | Update order status |
| GET | `/api/reservations` | List reservations |
| GET | `/api/reservations/availability` | Check table availability |
| POST | `/api/reservations` | Create a reservation |
| PATCH | `/api/reservations/:id/status` | Update reservation status |
| GET | `/api/inventory` | List inventory |
| GET | `/api/inventory/low-stock` | List low-stock ingredients |
| PATCH | `/api/inventory/:id/stock` | Update stock |
| GET | `/api/reports` | Restaurant analytics |

Orders, reservations, inventory, and reports require authentication. Menu read endpoints are public.

## Inventory Automation

Recipes connect menu items with inventory ingredients. When an order transitions from `Confirmed` to `Preparing`, the backend calculates the ingredient quantities needed for the ordered servings.

Sample recipe quantities should be verified against actual restaurant recipes before operational use.

## Important Notes

- This project is intended for learning and demonstration.
- No real payment gateway is integrated. Revenue reports reflect orders marked as `Paid` in the database.
- Review authorization rules before production use.
- Configure appropriate CORS settings, secure token handling, and restricted database permissions.
- Never commit `.env`, `.env.local`, passwords, access tokens, or private keys.

## License

Add a license before redistributing or publishing this project under specific open-source terms.
