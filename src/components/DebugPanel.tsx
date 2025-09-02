import React, { useState } from 'react';
import firebaseService from '../services/firebase-service';
import { User } from '../types';

const DebugPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const checkAllUsers = async () => {
    setLoading(true);
    setMessage('');
    try {
      const allUsers = await firebaseService.getAllUsers();
      setUsers(allUsers);
      setMessage(`Found ${allUsers.length} users in Firebase`);
      console.log('📊 All users in Firebase:', allUsers);
    } catch (error) {
      setMessage('Error loading users: ' + error);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md">
      <h3 className="text-lg font-semibold mb-2">🔍 Firebase Debug Panel</h3>
      
      <button
        onClick={checkAllUsers}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-3"
      >
        {loading ? 'Loading...' : 'Check All Users'}
      </button>

      {message && (
        <p className="text-sm text-gray-600 mb-3">{message}</p>
      )}

      {users.length > 0 && (
        <div className="max-h-40 overflow-y-auto">
          <h4 className="font-medium mb-2">Users in Firebase:</h4>
          {users.map((user) => (
            <div key={user.id} className="text-xs bg-gray-50 p-2 rounded mb-1">
              <div><strong>Name:</strong> {user.username}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Role:</strong> {user.role}</div>
              <div><strong>ID:</strong> {user.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebugPanel; 