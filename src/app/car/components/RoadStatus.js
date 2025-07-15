'use client';

import { FaRoad, FaInfoCircle, FaExclamationTriangle, FaClock } from 'react-icons/fa';

const RoadStatus = ({ road }) => {
  const isClosed = road.status === 'مغلق';
  const isBusy = road.status === 'مزدحم';
  
  const statusInfo = {
    'مفتوح': {
      icon: '🚗',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      iconColor: 'text-green-500 dark:text-green-400',
      border: 'border-green-500 dark:border-green-600',
      bg: 'bg-white dark:bg-green-800'
    },
    'مغلق': {
      icon: '⛔',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      iconColor: 'text-red-500 dark:text-red-400',
      border: 'border-red-500 dark:border-red-700',
      bg: 'bg-white dark:bg-red-800'
    },
    'مزدحم': {
      icon: '⚠️',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      border: 'border-yellow-500 dark:border-yellow-600',
      bg: 'bg-white dark:bg-yellow-800'
    },
    'غير معروف': {
      icon: '❓',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      iconColor: 'text-gray-500 dark:text-gray-400',
      border: 'border-gray-400 dark:border-gray-600',
      bg: 'bg-white dark:bg-gray-800'
    }
  }[road.status] || {
    icon: '❓',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    iconColor: 'text-gray-500 dark:text-gray-400',
    border: 'border-gray-400 dark:border-gray-600',
    bg: 'bg-white dark:bg-gray-800'
  };

  return (
    <div 
      className={`p-4 rounded-lg shadow-sm mb-4 transition-all duration-200 
      border-r-4 ${statusInfo.border} ${statusInfo.bg}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FaRoad className={`${statusInfo.iconColor} text-lg mr-2`} />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {road.name}
          </h3>
        </div>
        <div className="flex items-center">
          <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${statusInfo.color}`}>
            <span className="ml-1 text-lg">{statusInfo.icon}</span>
            {road.status}
          </span>
        </div>
      </div>
      
      {road.details && (
        <div className="mt-3 flex items-start">
          {isClosed ? (
            <FaExclamationTriangle className="text-red-500 mt-0.5 ml-1 flex-shrink-0" />
          ) : (
            <FaInfoCircle className="text-blue-500 mt-0.5 ml-1 flex-shrink-0" />
          )}
          <p className="text-sm text-gray-800 dark:text-gray-300 mr-2 leading-relaxed">
            {road.details}
          </p>
        </div>
      )}
      
      <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
        <FaClock className="ml-1" />
        <span>آخر تحديث: {new Date(road.lastUpdate || new Date()).toLocaleTimeString('ar-PS')}</span>
      </div>
    </div>
  );
};

export default RoadStatus;
