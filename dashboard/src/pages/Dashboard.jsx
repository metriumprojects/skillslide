import React, { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, CreditCard, Users, FileText, Percent, Save } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { useDispatch, useSelector } from 'react-redux';
import { getAllData, getAllUsers, updateSettings } from '../store/Reducer/DashboardReducer';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { users, allData, settings, settingsLoading } = useSelector((state) => state.dashboard);
  const [commissionPercent, setCommissionPercent] = useState(5);

  useEffect(() => {
    dispatch(getAllData());
  }, [dispatch]);

  useEffect(() => {
    setCommissionPercent(settings?.commissionPercent ?? 5);
  }, [settings?.commissionPercent]);

  useEffect(() => {
    // Dispatch with pagination parameters and debounced search term
    dispatch(
      getAllUsers({
        page: 1,
        limit: 10,
        search: "",
      })
    );
  }, [dispatch]);
  
  // Mock data for stats
  const stats = [
    { title: 'Total Lessons', value: allData?.totalLesson, icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Total Curriculums', value: allData?.totalCurriculum, icon: GraduationCap, color: 'bg-purple-500' },
    { title: 'Total Payments', value: allData?.totalAmount, icon: CreditCard, color: 'bg-green-500' },
    { title: 'Total Users', value: allData?.totalUser, icon: Users, color: 'bg-orange-500' },
    { title: 'Payment Requests', value: allData?.totalWithdraw, icon: FileText, color: 'bg-red-500' },
  ];

  const handleCommissionSave = async (event) => {
    event.preventDefault();
    const result = await dispatch(updateSettings({ commissionPercent }));

    if (updateSettings.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Settings updated successfully");
    } else {
      toast.error(result.payload?.message || "Unable to update settings");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <form
        onSubmit={handleCommissionSave}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-full bg-primary bg-opacity-10">
              <Percent size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Commission</h2>
              <p className="text-sm text-gray-500 mt-1">
                Applied to teacher earnings when a paid booking is confirmed.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Commission percentage
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={commissionPercent}
                  onChange={(event) => setCommissionPercent(event.target.value)}
                  className="w-full sm:w-48 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </label>

            <button
              type="submit"
              disabled={settingsLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {settingsLoading ? "Saving" : "Save"}
            </button>
          </div>
        </div>
      </form>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Recent Users</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Total Money
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Money
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name || "Not Added"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email || "Not Added"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'user' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.moneyTotal}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.money}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
