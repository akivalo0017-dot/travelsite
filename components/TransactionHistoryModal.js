import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TransactionHistoryModal({ userId, isOpen, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchTransactions();
    }
  }, [isOpen, userId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionColor = (type) => {
    const colors = {
      task_earning: 'text-green-600 bg-green-50 border-green-200',
      withdrawal: 'text-red-600 bg-red-50 border-red-200',
      admin_deposit: 'text-blue-600 bg-blue-50 border-blue-200',
      bonus: 'text-purple-600 bg-purple-50 border-purple-200',
      penalty: 'text-orange-600 bg-orange-50 border-orange-200'
    };
    return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getTransactionIcon = (type) => {
    const icons = {
      task_earning: '💰',
      withdrawal: '💸',
      admin_deposit: '🏦',
      bonus: '🎁',
      penalty: '⚠️'
    };
    return icons[type] || '📄';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
              <p className="text-gray-600">User ID: {userId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">💳</div>
              <div className="text-gray-500 text-lg">No transactions found</div>
              <div className="text-gray-400 text-sm mt-2">This user hasn't made any transactions yet</div>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className={`border rounded-lg p-4 ${getTransactionColor(transaction.type)}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl mt-1">{getTransactionIcon(transaction.type)}</div>
                      <div>
                        <div className="font-semibold capitalize">
                          {transaction.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 max-w-md">
                          {transaction.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(transaction.created_at).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold text-right ${
                      transaction.type === 'withdrawal' || transaction.type === 'penalty' 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {transaction.type === 'withdrawal' || transaction.type === 'penalty' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}