import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function BankDetailsModal({ userId, isOpen, onClose }) {
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchBankDetails();
    }
  }, [isOpen, userId]);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_details')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setBankDetails(data);
    } catch (error) {
      console.error('Error fetching bank details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bank Details</h2>
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
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-4 text-gray-600">Loading bank details...</div>
          ) : !bankDetails ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🏦</div>
              <div className="text-gray-500 text-lg mb-2">No Bank Details</div>
              <div className="text-gray-400 text-sm">User hasn't provided bank details yet</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-medium">
                  {bankDetails.bank_name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono">
                  {bankDetails.account_number}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono">
                  {bankDetails.ifsc_code}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-medium">
                  {bankDetails.account_holder_name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {bankDetails.upi_id || 'Not provided'}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Verification Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  bankDetails.is_verified 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {bankDetails.is_verified ? '✅ Verified' : '⏳ Pending Verification'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}