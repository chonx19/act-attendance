
import React, { useMemo } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Package, ArrowUpRight, ArrowDownRight, Trello, BarChart3 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-full bg-opacity-10 ${color.bg}`}>
        <Icon className={`w-6 h-6 ${color.text}`} />
      </div>
    </div>
    {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">{subtext}</p>}
  </div>
);

const Dashboard = () => {
  const { getDashboardStats, products, transactions, purchaseOrders } = useInventory();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const stats = getDashboardStats();

  // Redirect Customers to Contact page if they access Dashboard directly
  if (user?.role === UserRole.CUSTOMER) {
      return <Navigate to="/app/contact" replace />;
  }

  const isAdmin = user?.role === UserRole.ADMIN;

  // Recent transactions
  const recentTransactions = transactions.slice(0, 5);

  // PO Stats
  const activePOs = purchaseOrders.filter(p => p.status !== 'DONE').length;

  // Calculate Monthly Stats for Chart
  const monthlyData = useMemo(() => {
    const data: Record<string, { month: string; count: number; total: number; rawDate: number }> = {};
    
    purchaseOrders.forEach(po => {
      // Use startDate or fallback to creation (id is timestamp string)
      const dateStr = po.startDate || (Number(po.id) ? new Date(Number(po.id)).toISOString() : new Date().toISOString());
      const date = new Date(dateStr);
      
      if (isNaN(date.getTime())) return;
      
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date.toLocaleDateString(t('company_name_short') === 'ACT & R' ? 'th-TH' : 'en-US', { month: 'short', year: '2-digit' });
      
      if (!data[key]) {
        data[key] = { month: label, count: 0, total: 0, rawDate: date.getTime() };
      }
      
      data[key].count += 1;
      data[key].total += (po.totalAmount || 0);
    });

    // Sort by date and take last 12 months
    return Object.values(data)
      .sort((a, b) => a.rawDate - b.rawDate)
      .slice(-12);
  }, [purchaseOrders, t]);

  const chartColors = {
     text: theme === 'dark' ? '#94a3b8' : '#64748b',
     grid: theme === 'dark' ? '#334155' : '#f1f5f9',
     tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
     tooltipText: theme === 'dark' ? '#f8fafc' : '#0f172a'
  };

  // Employee Dashboard
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('dash_title')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('dash_subtitle')}</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Link to="/app/stock-movement" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center">
            <ArrowDownRight className="w-4 h-4 mr-2" /> IN
          </Link>
          <Link to="/app/stock-movement" className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 font-medium text-sm flex items-center">
            <ArrowUpRight className="w-4 h-4 mr-2" /> OUT
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title={t('dash_total_products')}
          value={stats.totalProducts} 
          icon={Package} 
          color={{ bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' }} 
        />
        <StatCard 
          title={t('dash_active_jobs')} 
          value={activePOs} 
          icon={Trello} 
          color={{ bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' }} 
        />
      </div>

      {/* Monthly Progress Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400"/> 
                {t('dash_chart_title')}
            </h3>
        </div>
        <div className="w-full h-[350px] min-w-0" style={{ minHeight: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: chartColors.text, fontSize: 12}} 
                        dy={10} 
                    />
                    <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: chartColors.text, fontSize: 12}}
                        label={{ value: t('dash_chart_axis_y'), angle: -90, position: 'insideLeft', style: { fill: chartColors.text, fontSize: 12 } }} 
                    />
                    
                    <Tooltip 
                        cursor={{ fill: theme === 'dark' ? '#334155' : '#f8fafc' }}
                        contentStyle={{ 
                            borderRadius: '8px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            backgroundColor: chartColors.tooltipBg,
                            color: chartColors.tooltipText
                        }}
                        formatter={(value: number, name: string) => {
                            if (name === 'count') return [value, t('dash_chart_axis_y')];
                            return [value, name];
                        }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                    
                    <Bar 
                        yAxisId="left" 
                        dataKey="count" 
                        name={t('dash_chart_axis_y')}
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]} 
                        barSize={isAdmin ? 20 : 40}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('dash_recent_activity')}</h3>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">{t('dash_no_activity')}</p>
            ) : (
              recentTransactions.map((tx) => {
                const product = products.find(p => p.id === tx.productId);
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs
                        ${tx.type === 'รับเข้า' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                          tx.type === 'เบิกออก' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}
                      `}>
                        {tx.type === 'รับเข้า' ? 'IN' : tx.type === 'เบิกออก' ? 'OUT' : 'ADJ'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{product?.productCode}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(tx.date).toLocaleDateString(t('company_name_short') === 'ACT & R' ? 'th-TH' : 'en-US')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {tx.type === 'รับเข้า' ? '+' : tx.type === 'เบิกออก' ? '-' : ''}{tx.quantity}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-6 text-center">
            <Link to="/app/reports" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              {t('dash_view_all')} &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
