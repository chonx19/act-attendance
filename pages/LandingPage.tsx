import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wrench, Truck, Package, Globe, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ==================================================================================
// ส่วนตั้งค่ารูปภาพ (IMAGE CONFIGURATION)
// ==================================================================================

// 1. รูป Card.jpg (พื้นหลังส่วนหัว)
const HERO_BG_ID = "1MPAdXzZuT67J7uqc_gkQbCPIXKz-hOEF"; 

// 2. รูป Profile1.png (รูปซ้ายในส่วนหัว)
const HERO_SHELF_ID = "1d1C3NBasue5Dn58e9af7kekeSviNIxbM"; 

// 3. รูป Act&R.jpg (ส่วนเกี่ยวกับเรา)
const ABOUT_IMAGE_ID = "1Tc6_mtQ46cLenJw6xEXI8B5Owb76FoOz"; 

// ==================================================================================

const LandingPage = () => {
  const { t, toggleLanguage, language } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-slate-900 text-white py-4 px-6 fixed w-full top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg border border-blue-500">A</div>
             <div className="flex flex-col">
               <span className="text-xl font-bold tracking-tight leading-none">ACT<span className="text-blue-400">&</span>R</span>
               <span className="text-[0.6rem] text-slate-400 tracking-wider">HIGH PRECISION PART</span>
             </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex space-x-8">
              <a href="#services" className="hover:text-blue-400 transition text-sm font-medium">{t('nav_services')}</a>
              <a href="#about" className="hover:text-blue-400 transition text-sm font-medium">{t('nav_about')}</a>
              <a href="#contact" className="hover:text-blue-400 transition text-sm font-medium">{t('nav_contact')}</a>
            </div>
            
            <button 
              onClick={toggleLanguage}
              className="flex items-center px-3 py-1 bg-slate-800 rounded-full border border-slate-700 hover:border-blue-500 transition text-xs font-bold"
            >
              <Globe className="w-3 h-3 mr-2 text-blue-400" />
              {language === 'th' ? 'EN' : 'TH'}
            </button>

            <Link to="/login" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition shadow-lg shadow-blue-900/50 text-sm">
              {t('nav_login')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 bg-slate-900 text-white relative overflow-hidden">
        {/* Background Overlay Image */}
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src={`https://drive.google.com/thumbnail?id=${HERO_BG_ID}&sz=w3000`}
            alt="Industrial Warehouse Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8">
            <div>
              {/* Removed ISO Badge */}
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {t('hero_title')}
              </h1>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed">
              {t('hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="#contact" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition text-center shadow-lg shadow-blue-900/50">
                {t('cta_contact')}
              </a>
              <Link to="/login" className="px-8 py-3 border border-slate-600 bg-slate-800/50 backdrop-blur-sm rounded-lg font-medium hover:bg-slate-700 transition flex items-center justify-center">
                {t('cta_employee')} <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="grid grid-cols-2 gap-4">
              <img 
                src={`https://drive.google.com/thumbnail?id=${HERO_SHELF_ID}&sz=w1000`}
                alt="Profile Shelf" 
                className="rounded-2xl shadow-2xl border border-slate-700 translate-y-8"
                referrerPolicy="no-referrer"
              />
              <img 
                src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Tools and Equipment" 
                className="rounded-2xl shadow-2xl border border-slate-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('service_title')}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              {language === 'th' ? 'เราพร้อมสนับสนุนทุกความต้องการของโรงงานอุตสาหกรรมด้วยสินค้าคุณภาพ' : 'We are ready to support all industrial needs with quality products.'}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition border border-gray-100 group">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition">
                <Wrench className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">{t('service_1_title')}</h3>
              <p className="text-gray-500 leading-relaxed">
                {t('service_1_desc')}
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition border border-gray-100 group">
              <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-600 group-hover:text-white transition">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">{t('service_2_title')}</h3>
              <p className="text-gray-500 leading-relaxed">
                {t('service_2_desc')}
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition border border-gray-100 group">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-6 group-hover:bg-green-600 group-hover:text-white transition">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">{t('service_3_title')}</h3>
              <p className="text-gray-500 leading-relaxed">
                {t('service_3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
           <div className="md:w-1/2">
             <img 
               src={`https://drive.google.com/thumbnail?id=${ABOUT_IMAGE_ID}&sz=w1000`}
               alt="About Act & R" 
               className="rounded-2xl shadow-xl w-full h-auto object-cover"
               referrerPolicy="no-referrer"
             />
           </div>
           <div className="md:w-1/2 space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">
                {language === 'th' ? 'เกี่ยวกับ ACT & R' : 'About ACT & R'}
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  <strong>{t('company_full_th')}</strong> {language === 'th' 
                    ? 'ดำเนินธุรกิจเกี่ยวกับการจำหน่าย วัตถุดิบ วัสดุสิ้นเปลือง เครื่องจักร เครื่องมือเครื่องใช้ และวัสดุอุปกรณ์ทุกชนิด สำหรับโรงงานอุตสาหกรรม โดยจัดอยู่ในหมวดธุรกิจการขายส่งเครื่องจักรและอุปกรณ์อื่นๆ' 
                    : 'operates in the distribution of raw materials, consumables, machinery, tools, and all kinds of materials and equipment for industrial factories, classified under wholesale of other machinery and equipment.'}
                </p>
                <p>
                  {language === 'th' 
                    ? 'เรามุ่งมั่นที่จะเป็นคู่ค้าที่เชื่อถือได้ โดยการคัดสรรสินค้าคุณภาพและการบริการที่รวดเร็ว เพื่อสนับสนุนการทำงานของลูกค้าให้ราบรื่นและมีประสิทธิภาพสูงสุด' 
                    : 'We strive to be a reliable partner by selecting quality products and providing fast service to support our customers operations for maximum efficiency.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                 <div className="border-l-4 border-blue-600 pl-4">
                    <h4 className="font-bold text-xl text-gray-900">{language === 'th' ? 'ครบวงจร' : 'One-Stop'}</h4>
                    <p className="text-sm text-gray-500">{language === 'th' ? 'วัสดุและอุปกรณ์' : 'Materials & Tools'}</p>
                 </div>
                 <div className="border-l-4 border-blue-600 pl-4">
                    <h4 className="font-bold text-xl text-gray-900">{language === 'th' ? 'บริการจัดหา' : 'Sourcing'}</h4>
                    <p className="text-sm text-gray-500">{language === 'th' ? 'ตามความต้องการ' : 'On Demand'}</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white text-lg font-bold mb-4">{t('company_full_en')}</h4>
            <p className="mb-4 text-sm leading-relaxed max-w-md">
              {t('company_desc')}
            </p>
            <div className="flex items-start mb-2">
               <MapPin className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-blue-500" />
               <div>
                 <p className="text-white text-sm">{t('contact_address')}</p>
                 <a 
                   href="https://maps.app.goo.gl/amuYLnBXGUXkUxvc7" 
                   target="_blank" 
                   rel="noreferrer"
                   className="text-blue-400 text-xs hover:text-blue-300 underline mt-1 inline-block"
                 >
                   {t('google_map_label')}
                 </a>
               </div>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">{t('nav_services')}</h4>
            <ul className="space-y-2 text-sm">
              <li>{t('service_1_title')}</li>
              <li>{t('service_2_title')}</li>
              <li>{t('service_3_title')}</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">{t('nav_contact')}</h4>
            <ul className="space-y-2 text-sm">
              <li>{t('contact_phone')}</li>
              <li>Email: sirapatchara_act@yahoo.co.th</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-8 text-xs text-center">
            &copy; 2024 ACT & R HIGH PRECISION PART CO., LTD. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;