import React from 'react';
import { motion } from 'framer-motion';
import { calculateAge } from '../lib/utils';

const ChildCard = ({ child, onViewDetails }) => {
  const getGenderColor = (gender) => {
    return gender === 'male' 
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
      : 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300';
  };

  const getGenderIcon = (gender) => {
    return gender === 'male' ? '👦' : '👧';
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
      onClick={() => onViewDetails && onViewDetails(child)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full ${getGenderColor(child.gender)} flex items-center justify-center text-lg`}>
          {getGenderIcon(child.gender)}
        </div>
        <div>
          <p className="font-medium text-slate-800 dark:text-white">
            {child.gender === 'male' ? 'Male Calf' : 'Female Calf'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Born: {formatDate(child.birthDate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">Gender</p>
          <p className="font-medium text-slate-800 dark:text-white capitalize">
            {child.gender}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">Age</p>
          <p className="font-medium text-slate-800 dark:text-white">
            {calculateAge(child.birthDate)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ChildCard;