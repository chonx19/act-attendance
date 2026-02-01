import React from 'react';

const CategoryList = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-4">Categories Module Disabled</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        The category management feature has been deprecated in the current system version. 
        Please manage product attributes directly in the Product List.
      </p>
    </div>
  );
};

export default CategoryList;