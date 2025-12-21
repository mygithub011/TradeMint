# Smart Trade Frontend

A modern, professional React-based frontend for the Smart Trade platform - connecting traders and clients for premium trading services.

## 🚀 Features

### For Clients
- Browse marketplace of trading services
- Subscribe to professional traders
- View active subscriptions with expiry tracking
- Access trade history and performance
- Receive real-time trade alerts
- Telegram group integration status

### For Traders
- Create and manage trading services
- View subscriber base and analytics
- Send real-time trade alerts to clients
- Track trade history and performance
- Manage service pricing and duration

### For Admins
- Approve/reject trader registrations
- View platform statistics
- Monitor all users and services
- Platform-wide analytics dashboard

## 🛠️ Tech Stack

- **React 18** - Modern UI library
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **Vite** - Fast build tool and dev server

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Dashboard.jsx     # (old, can be removed)
│   │   └── Login.jsx         # (old, can be removed)
│   ├── pages/                # Route pages
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Marketplace.jsx
│   │   ├── ClientDashboard.jsx
│   │   ├── TraderDashboard.jsx
│   │   └── AdminPanel.jsx
│   ├── services/             # API service layer
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── clientService.js
│   │   ├── traderService.js
│   │   └── adminService.js
│   ├── contexts/             # React Context providers
│   │   └── AuthContext.jsx
│   ├── App.jsx               # Main app component
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Smart Trade backend running on `http://127.0.0.1:8000`

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

The frontend will be available at:
```
http://localhost:5173
```

### Step 3: Build for Production
```bash
npm run build
```

### Step 4: Preview Production Build
```bash
npm run preview
```

## 🔌 Backend Integration

The frontend connects to the FastAPI backend at:
```
http://127.0.0.1:8000
```

To change the API base URL, edit `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://127.0.0.1:8000';
```

## 🔐 Authentication Flow

1. **Register**: Users can register as Client or Trader
2. **Trader Approval**: Traders require admin approval before accessing features
3. **Login**: JWT token stored in localStorage
4. **Protected Routes**: Role-based access control
5. **Auto Redirect**: Users redirected based on their role

## 🧪 Testing Guide

### 1. Start Backend
```bash
cd backend
uvicorn main:app --reload
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test User Flows

#### **Admin Flow**
1. Create admin user (via backend or seed script)
2. Login at `/login`
3. Access Admin Panel at `/admin`
4. Approve pending traders

#### **Trader Flow**
1. Register as Trader at `/register`
2. Wait for admin approval
3. Login at `/login`
4. Access Trader Dashboard at `/trader/dashboard`
5. Create a service
6. Send trade alerts to subscribers

#### **Client Flow**
1. Register as Client at `/register`
2. Login at `/login`
3. Browse Marketplace at `/marketplace`
4. Subscribe to a service
5. View dashboard at `/client/dashboard`
6. Check active subscriptions and trade history

## 📱 Pages & Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Home/Landing page |
| `/login` | Public | Login page |
| `/register` | Public | Registration page |
| `/marketplace` | Public | Browse services |
| `/client/dashboard` | Client | Client dashboard |
| `/trader/dashboard` | Trader | Trader dashboard |
| `/admin` | Admin | Admin panel |

## 🎨 UI/UX Features

- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Modern, professional fintech aesthetic
- ✅ Real-time data updates
- ✅ Loading states and error handling
- ✅ Success/error notifications
- ✅ Role-based navigation
- ✅ Protected routes with redirects
- ✅ Clean card-based layouts
- ✅ Color-coded status indicators
- ✅ Interactive modals and forms

## 🔒 Security Features

- JWT token authentication
- Automatic token refresh
- Token expiry handling
- Role-based route protection
- Secure API interceptors
- XSS protection via React
- CSRF protection ready

## 🚀 API Integration

All API calls are centralized in the `services/` directory:

- **authService.js** - Authentication (login, register, logout)
- **clientService.js** - Client operations (subscriptions, trades)
- **traderService.js** - Trader operations (services, alerts)
- **adminService.js** - Admin operations (approvals, stats)
- **api.js** - Axios instance with interceptors

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.js or kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### API Connection Failed
- Ensure backend is running on port 8000
- Check CORS settings in backend
- Verify API_BASE_URL in `src/services/api.js`

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Environment Variables (Optional)

Create a `.env` file for configuration:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_APP_NAME=Smart Trade
```

Access in code:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

## 🎯 Future Enhancements

- [ ] Dark mode support
- [ ] Real-time WebSocket notifications
- [ ] Advanced filtering in marketplace
- [ ] Performance analytics charts
- [ ] Multi-language support
- [ ] Email notifications
- [ ] Payment gateway integration
- [ ] Mobile app (React Native)

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Contact: support@smarttrade.com
- Documentation: [docs.smarttrade.com](https://docs.smarttrade.com)

---

Built with ❤️ by the Smart Trade Team
