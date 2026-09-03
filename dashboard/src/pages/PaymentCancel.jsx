import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import PaymentTable from '../components/PaymentTable';
import { useDispatch, useSelector } from 'react-redux';
import { getAllWithdrawals } from '../store/Reducer/WithdrawReducer';
import { useEffect } from 'react';

const PaymentCancel = () => {
  const dispatch = useDispatch();
  const { allWithdrawals, loading } = useSelector((state) => state.withdrawal);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(()=> {
    dispatch(getAllWithdrawals({status: "rejected", page, limit}));
  }, [page, limit])

  return (
    <PaymentTable 
      data={allWithdrawals} 
      title="Cancelled Payments" 
      showActions={false} // Typically cancelled payments don't need immediate action
    >
      {!loading && allWithdrawals.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`p-2 rounded-md ${
                  page === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              <span>{page}</span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={allWithdrawals.length < limit} 
                className={`p-2 rounded-md text-gray-600 hover:bg-gray-100 ${
                  allWithdrawals.length < limit
                    ? "text-gray-400 cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </PaymentTable>
  );
};

export default PaymentCancel;
