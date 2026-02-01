
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { storageService } from '../services/storageService';
import { Lock, User, ArrowLeft, Globe, Loader2 } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientIp, setClientIp] = useState('0.0.0.0');

  const { login } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Mock IP fetching - In real app this comes from backend or specific service
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(() => setClientIp('127.0.0.1')); // Fallback
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await storageService.login(username, password, clientIp);
      if (user) {
        // Create Session Log
        storageService.createSession(user, clientIp);
        login(user);
        navigate('/app/dashboard');
      } else {
        setError(language === 'th' ? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' : 'Invalid username or password');
      }
    } catch (err: any) {
      setError(err.message || (language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <Link to="/" className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('login_back')}
          </Link>
          <button onClick={toggleLanguage} className="text-gray-400 hover:text-blue-600 transition">
            <Globe className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
            ACT<span className="text-blue-600">&</span>R
            <br />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">HIGH PRECISION PART CO., LTD.</span>
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest mt-1">
            {language === 'th' ? 'บริษัท แอคท์ แอนด์ อาร์ ไฮ พรีซิชั่น พาร์ท จำกัด' : ''}
          </p>
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-6">{t('login_title')}</h2>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('login_username')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
                placeholder=""
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('login_password')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
                placeholder=""
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : t('login_btn')}
          </button>
        </form>


      </div>
    </div>
  );
};

export default Login;
