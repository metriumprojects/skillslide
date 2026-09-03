import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Lessons from './pages/Lessons';
import Curriculums from './pages/Curriculums';
import PaymentRequest from './pages/PaymentRequest';
import PaymentApproved from './pages/PaymentApproved';
import PaymentCancel from './pages/PaymentCancel';
import Login from './pages/Login';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from './store/PrivateRoute';
import UserDetail from './pages/UserDetail';
import Categories from './pages/Categories';
import Listings from './pages/Listings';
import StudentStories from './pages/StudentStories';

function App() {
  return (
    <>      <ToastContainer
        position="top-right"
        autoClose={1000}
        pauseOnHover
        theme="light"
      />
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="categories" element={<Categories />} />
          <Route path="student-stories" element={<StudentStories />} />
          <Route path="user-detail/:id" element={<UserDetail />} />
          <Route path="lessons" element={<Lessons />} />
          <Route path="curriculums" element={<Curriculums />} />
          <Route path="listings" element={<Listings />} />
          <Route path="payment/request" element={<PaymentRequest />} />
          <Route path="payment/approved" element={<PaymentApproved />} />
          <Route path="payment/cancel" element={<PaymentCancel />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
