# 🔧 Vehicle Parts Management System (VPMS)

A comprehensive full-stack application for managing vehicle parts inventory, vendors, customers, and service appointments.

## 📋 Features

- **Inventory Management**: Track parts stock levels, pricing, and vendor relationships
- **Vendor Management**: Manage supplier information and purchase orders
- **Customer Management**: Store and manage customer profiles and service history
- **Sales & Transactions**: Process sales, track payments, and generate reports
- **Appointments**: Schedule and manage vehicle service appointments
- **Staff Management**: Admin controls for managing staff accounts and permissions
- **Financial Reports**: Generate revenue trends, payment status, and inventory analytics
- **Role-Based Access**: Three user roles - Admin, Staff, and Customer

## 🛠️ Tech Stack

### Backend
- **.NET 8.0** - RESTful API
- **Entity Framework Core** - ORM
- **SQL Server** - Database
- **JWT Authentication** - Secure user authentication

### Frontend
- **React 18** - UI Framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Lucide React** - Icons

## 📦 Prerequisites

- **.NET SDK 8.0** or higher
- **Node.js 16+** and npm
- **SQL Server** (2019 or later)
- **Visual Studio** or **VS Code**

## 🚀 Getting Started

### Backend Setup
```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run
```

The API will run on `http://localhost:5169`

### Frontend Setup
```bash
cd frontend/VehicleInventorySystem.Web
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📁 Project Structure

```
VPMS/
├── backend/                    # .NET Core API
│   ├── VehicleInventorySystem.Api/
│   │   ├── Controllers/        # API endpoints
│   │   ├── Models/             # Data models
│   │   ├── Services/           # Business logic
│   │   └── Migrations/         # Database migrations
│   └── appsettings.json        # Configuration
│
└── frontend/                   # React/Vite application
    └── VehicleInventorySystem.Web/
        ├── src/
        │   ├── pages/          # Page components
        │   ├── components/     # Reusable components
        │   ├── services/       # API client services
        │   └── styles/         # CSS styles
        └── package.json
```

## 🔐 Authentication

- Default admin credentials are set up during initial database migration
- JWT tokens are used for API authentication
- Passwords are securely hashed using industry-standard algorithms

## 📊 API Endpoints

Key endpoints include:
- `POST /api/auth/login` - User login
- `GET/POST /api/parts` - Parts management
- `GET/POST /api/vendors` - Vendor management
- `GET/POST /api/customers` - Customer management
- `GET/POST /api/Transactions` - Sales and purchases
- `GET /api/reports` - Financial reports

## 🖥️ Default User Roles

| Role | Access |
|------|--------|
| **Admin** | Full system access, staff management, reports |
| **Staff** | Inventory, customers, sales, appointments |
| **Customer** | View parts, book appointments, track orders |

## 📝 License

This project is proprietary and confidential.

## 👨‍💻 Support

For issues or questions, please create an issue in the repository.

---

**Version**: 1.0.0  
**Last Updated**: June 2026
