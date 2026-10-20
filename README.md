

\# DineFlow — Restaurant Management System



A full-stack restaurant management application built to manage menu items, customer orders, table reservations, ingredient inventory, and operational analytics from one dashboard.



\## Features



\- \*\*Admin authentication:\*\* JWT-based login, bcrypt password hashing, session verification, and role-aware account management.

\- \*\*Restaurant dashboard:\*\* Overview of menu items, daily orders, reservations, and low-stock ingredients.

\- \*\*Menu management:\*\* Browse available menu items and their details.

\- \*\*Orders \& kitchen:\*\* Create orders, view order details, and update kitchen status from Pending to Served.

\- \*\*Table reservations:\*\* Check table availability, store guest bookings, and prevent overlapping reservations for the same table.

\- \*\*Inventory management:\*\* Track ingredients, quantities, units, suppliers, unit costs, and reorder thresholds.

\- \*\*Automatic inventory deduction:\*\* Consume recipe ingredients when an order transitions from Confirmed to Preparing.

\- \*\*Inventory movement ledger:\*\* Record ingredient consumption, stock before/after values, and associated orders.

\- \*\*Reports \& analytics:\*\* View order counts, inventory valuation, paid revenue, and popular dishes.

\- \*\*Responsive UI:\*\* Dashboard styling designed for desktop and smaller screens.



\## Tech Stack



\*\*Frontend\*\*

\- React

\- Vite

\- JavaScript

\- CSS

\- Lucide React icons



\*\*Backend\*\*

\- Node.js

\- Express.js

\- MongoDB

\- Mongoose

\- JSON Web Tokens (JWT)

\- bcryptjs



\## Project Structure



```text

C:/CodeAlpha\_Restaurant\_Management

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



\## Prerequisites



\- Node.js 22 or a compatible recent version

\- npm

\- A MongoDB database, such as MongoDB Atlas

\- Git (optional, for version control)



\## Local Setup



\### 1. Clone the repository



```bash

git clone YOUR\_GITHUB\_REPOSITORY\_URL

cd CodeAlpha\_Restaurant\_Management

```



Replace `YOUR\_GITHUB\_REPOSITORY\_URL` with the repository's actual URL.



\### 2. Install backend dependencies



```bash

npm install

```



\### 3. Configure environment variables



Create a local `.env` file in the project root.



Use the exact environment variable names expected by `config/db.js` and `server.js`. Configure your MongoDB connection string, JWT signing secret, server port, and any other variables required by the project.



Never commit real credentials, database connection strings, JWT secrets, or production passwords.



\### 4. Start the backend



```bash

npm run dev

```



The development server is configured to run on:



`http://localhost:5000`



Health check:



`http://localhost:5000/api/health`



\### 5. Configure the frontend



Open a second terminal:



```bash

cd client

npm install

```



Create `client/.env.local` containing:



```env

VITE\_API\_URL=http://localhost:5000

```



\### 6. Start the frontend



From the `client` directory:



```bash

npm run dev

```



Open the local URL printed by Vite, typically:



`http://localhost:5173`



\## Initial Admin Setup



Create the first administrator using the interactive setup script:



```bash

node scripts/createAdmin.js

```



The script prompts for the administrator's name, email, and password. Password input is hidden, and the password is stored as a bcrypt hash.



Keep the administrator credentials private. Do not commit passwords or JWT tokens to the repository.



\## API Overview



| Method | Endpoint | Purpose |

|---|---|---|

| GET | `/api/health` | Health check |

| GET | `/api/menu` | List menu items |

| GET | `/api/menu/:id` | Get a menu item |

| POST | `/api/auth/login` | Authenticate a user |

| GET | `/api/auth/me` | Get the authenticated user |

| POST | `/api/auth/staff` | Create a staff account (admin only) |

| GET | `/api/orders` | List orders |

| POST | `/api/orders` | Create an order |

| PATCH | `/api/orders/:id/status` | Update order status |

| GET | `/api/reservations` | List reservations |

| GET | `/api/reservations/availability` | Check table availability |

| POST | `/api/reservations` | Create a reservation |

| PATCH | `/api/reservations/:id/status` | Update reservation status |

| GET | `/api/inventory` | List inventory |

| GET | `/api/inventory/low-stock` | List low-stock ingredients |

| PATCH | `/api/inventory/:id/stock` | Receive or consume stock |

| GET | `/api/reports` | Restaurant analytics overview |



The orders, reservations, inventory, and reports routes require authentication. Menu read endpoints are public.



\## Inventory Automation



Recipes link menu items to inventory ingredients. When an order transitions from `Confirmed` to `Preparing`, the backend calculates the ingredient quantities required for the ordered servings.



The intended workflow uses a MongoDB transaction to coordinate stock deductions, movement ledger entries, and the order status update. An unsuccessful transaction should not partially commit those changes.



Sample recipe quantities are illustrative and must be verified against the restaurant's actual standardized recipes before operational use.



\## Important Notes



\- This is a development project; configure and test all secrets and environment variables before deployment.

\- No real payment gateway is integrated. Paid revenue reports count orders marked `Paid` in the database and do not prove a real-world payment occurred.

\- Review authorization rules for each management action before production deployment. Authentication alone does not enforce every admin/staff permission.

\- For production, use HTTPS, rate limiting, secure session/token handling, appropriate CORS settings, and a restricted database user.

\- Never commit `.env`, `.env.local`, access tokens, passwords, or private keys.



\## License



Add a license before redistributing or publishing the project under specific open-source terms.



