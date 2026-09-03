import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap, 
  CreditCard, 
  ChevronDown, 
  ChevronRight,
  X,
  LogOut,
  Layers,
  Quote
} from 'lucide-react';
import { getUser, LogoutUser, } from '../store/Reducer/AuthReducer';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';

const Sidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Layers, label: 'Categories', path: '/categories' },
    { icon: Quote, label: 'Student Stories', path: '/student-stories' },
    { icon: BookOpen, label: 'Lessons', path: '/lessons' },
    { icon: GraduationCap, label: 'Curriculums', path: '/curriculums' },
    { icon: BookOpen, label: 'Listings', path: '/listings' },
  ];

  const paymentItems = [
    { label: 'Payment Request', path: '/payment/request' },
    { label: 'Payment Approved', path: '/payment/approved' },
    { label: 'Payment Cancel', path: '/payment/cancel' },
  ];

    const handleLogout = (e) => {
      e.preventDefault();
    dispatch(LogoutUser()).then((res) => {
      if (res.payload.status) {
        toast.success(res.payload.message);
        dispatch(getUser());
      } else {
        toast.error(res.payload.message);
      }
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:h-auto lg:min-h-screen
        `}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-primary">AdminPanel</span>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive(item.path) 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-700 hover:bg-gray-100'}
              `}
            >
              <item.icon size={20} className="mr-3" />
              {item.label}
            </Link>
          ))}

          {/* Payment Dropdown */}
          <div>
            <button
              onClick={() => setIsPaymentOpen(!isPaymentOpen)}
              className={`
                flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${location.pathname.startsWith('/payment') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-700 hover:bg-gray-100'}
              `}
            >
              <div className="flex items-center">
                <CreditCard size={20} className="mr-3" />
                Payment
              </div>
              {isPaymentOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {isPaymentOpen && (
              <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-100 pl-2">
                {paymentItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      block px-4 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive(item.path) 
                        ? 'text-primary bg-gray-50' 
                        : 'text-gray-600 hover:bg-gray-50'}
                    `}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
