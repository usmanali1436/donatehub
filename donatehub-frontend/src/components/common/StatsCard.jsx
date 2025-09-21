import React from 'react';
import Card from './Card';
import { formatCurrency } from '../../utils/helpers';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  color = 'blue',
  formatValue = true 
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
    indigo: 'text-indigo-600 bg-indigo-100',
  };

  const formatDisplayValue = (val) => {
    if (!formatValue) return val;
    if (typeof val === 'number' && val >= 1000) {
      return formatCurrency(val);
    }
    return val;
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
            {icon && (
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                <span className="text-lg">{icon}</span>
              </div>
            )}
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatDisplayValue(value)}
            </p>
            {trend && trendValue && (
              <div className="mt-2 flex items-center text-sm">
                <span className={`inline-flex items-center ${
                  trend === 'up' 
                    ? 'text-green-600' 
                    : trend === 'down' 
                    ? 'text-red-600' 
                    : 'text-gray-600'
                }`}>
                  {trend === 'up' && '↗️'}
                  {trend === 'down' && '↘️'}
                  {trend === 'neutral' && '→'}
                  <span className="ml-1">{trendValue}</span>
                </span>
                <span className="text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;