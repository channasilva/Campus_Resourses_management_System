import React, { useState } from 'react';
import { Wrench, AlertTriangle, CheckCircle } from 'lucide-react';
import firebaseService from '../services/firebase-service';
import toast from 'react-hot-toast';

interface MaintenanceToggleProps {
  resourceId: string;
  resourceName: string;
  isUnderMaintenance: boolean;
  onToggle: (isUnderMaintenance: boolean) => void;
  className?: string;
}

const MaintenanceToggle: React.FC<MaintenanceToggleProps> = ({
  resourceId,
  resourceName,
  isUnderMaintenance,
  onToggle,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [maintenanceNote, setMaintenanceNote] = useState('');

  const handleToggle = async () => {
    if (isUnderMaintenance) {
      // Turning off maintenance
      setIsLoading(true);
      try {
        await firebaseService.updateResource(resourceId, {
          isUnderMaintenance: false,
          maintenanceNote: '',
          status: 'available'
        });
        onToggle(false);
        toast.success(`${resourceName} is now available for booking`);
      } catch (error) {
        console.error('Error updating resource:', error);
        toast.error('Failed to update resource status');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Turning on maintenance - show note input
      setShowNoteInput(true);
    }
  };

  const handleSubmitMaintenance = async () => {
    if (!maintenanceNote.trim()) {
      toast.error('Please enter a maintenance note');
      return;
    }

    setIsLoading(true);
    try {
      await firebaseService.updateResource(resourceId, {
        isUnderMaintenance: true,
        maintenanceNote: maintenanceNote.trim(),
        status: 'maintenance'
      });
      onToggle(true);
      setShowNoteInput(false);
      setMaintenanceNote('');
      toast.success(`${resourceName} is now under maintenance`);
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowNoteInput(false);
    setMaintenanceNote('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Toggle Button */}
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
          isUnderMaintenance
            ? 'bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900 dark:hover:bg-orange-800 dark:text-orange-300'
            : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-300'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center space-x-2">
          {isUnderMaintenance ? (
            <>
              <Wrench className="w-4 h-4" />
              <span>Under Maintenance</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Available</span>
            </>
          )}
        </div>
        
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>

      {/* Maintenance Note Input Modal */}
      {showNoteInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md mx-auto">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                Set Maintenance Note
              </h4>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Please provide a reason for putting "{resourceName}" under maintenance:
            </p>
            
            <textarea
              value={maintenanceNote}
              onChange={(e) => setMaintenanceNote(e.target.value)}
              placeholder="Enter maintenance reason..."
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none text-sm"
              rows={4}
              autoFocus
            />
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleSubmitMaintenance}
                disabled={isLoading || !maintenanceNote.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Set Maintenance'
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceToggle; 