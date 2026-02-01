
import React, { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import { Message, UserRole } from '../types';
import { Mail, Send, CheckCircle, Clock, Inbox, ChevronRight } from 'lucide-react';

const CustomerContact = () => {
  const { user } = useAuth();
  const { messages, sendMessage, markMessageRead } = useInventory();
  
  const [activeTab, setActiveTab] = useState<'COMPOSE' | 'INBOX'>('COMPOSE');

  // Customer Form State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [msgType, setMsgType] = useState<'INQUIRY' | 'QUOTATION_REQUEST' | 'GENERAL'>('GENERAL');
  const [success, setSuccess] = useState(false);

  // Admin: Filtered Messages
  const adminInbox = messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Customer: Sent Messages History
  const myHistory = messages
    .filter(m => m.senderId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      subject: subject,
      content: content,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: msgType
    };

    await sendMessage(newMessage);
    setSubject('');
    setContent('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSendEmail = () => {
      // Feature to open actual email client
      const mailtoLink = `mailto:sirapatchara_act@yahoo.co.th?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
      window.open(mailtoLink, '_blank');
  };

  // --- ADMIN VIEW ---
  if (user?.role === UserRole.ADMIN) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Message Inbox</h2>
             <p className="text-gray-500 dark:text-gray-400">Messages from customers</p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg font-bold">
              {adminInbox.filter(m => !m.isRead).length} Unread
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
             {adminInbox.length === 0 ? (
                 <div className="p-10 text-center text-gray-400">No messages found.</div>
             ) : (
                 <div className="divide-y divide-gray-100 dark:divide-slate-700">
                     {adminInbox.map(msg => (
                         <div key={msg.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer ${!msg.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`} onClick={() => markMessageRead(msg.id)}>
                             <div className="flex justify-between items-start mb-1">
                                 <div className="flex items-center gap-2">
                                     {!msg.isRead && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                                     <span className="font-bold text-gray-900 dark:text-white">{msg.senderName}</span>
                                     <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300">{msg.type}</span>
                                 </div>
                                 <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
                             </div>
                             <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{msg.subject}</h4>
                             <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{msg.content}</p>
                         </div>
                     ))}
                 </div>
             )}
        </div>
      </div>
    );
  }

  // --- CUSTOMER VIEW ---
  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Contact & Support</h2>
          <p className="text-gray-500 dark:text-gray-400">Send inquiries or request quotations directly to our sales team.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Form */}
          <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-600"/> Send Message
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic</label>
                      <select 
                        value={msgType} 
                        onChange={(e: any) => setMsgType(e.target.value)}
                        className="w-full border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white"
                      >
                          <option value="GENERAL">General Inquiry (สอบถามทั่วไป)</option>
                          <option value="QUOTATION_REQUEST">Request Quotation (ขอใบเสนอราคา)</option>
                          <option value="INQUIRY">Order Status (ติดตามสถานะสินค้า)</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                      <input 
                        required 
                        type="text" 
                        value={subject} 
                        onChange={e => setSubject(e.target.value)}
                        className="w-full border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white"
                        placeholder="e.g., Request price for Part #123"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                      <textarea 
                        required 
                        rows={5}
                        value={content} 
                        onChange={e => setContent(e.target.value)}
                        className="w-full border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white"
                        placeholder="Type your details here..."
                      />
                  </div>

                  <div className="flex gap-3 pt-2">
                      <button 
                        type="submit" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold flex justify-center items-center shadow-md transition-all"
                      >
                          <Send className="w-4 h-4 mr-2" /> Send Message
                      </button>
                      <button 
                         type="button" 
                         onClick={handleSendEmail}
                         className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 font-medium"
                         title="Open in your Email Client"
                      >
                         Open Email App
                      </button>
                  </div>
              </form>
              
              {success && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg flex items-center justify-center animate-fade-in">
                      <CheckCircle className="w-5 h-5 mr-2" /> Message Sent Successfully!
                  </div>
              )}
          </div>

          {/* History / Info Side */}
          <div className="space-y-6">
              <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg">
                  <h4 className="font-bold text-lg mb-2">Direct Contact</h4>
                  <p className="text-blue-100 text-sm mb-4">Urgent inquiry? Call us directly.</p>
                  <div className="space-y-2">
                      <p className="font-mono font-bold text-xl">086-338-9283</p>
                      <p className="text-sm opacity-80">sirapatchara_act@yahoo.co.th</p>
                  </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 h-80 overflow-y-auto">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center sticky top-0 bg-white dark:bg-slate-800 pb-2 border-b dark:border-slate-700">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" /> Recent Messages
                  </h4>
                  {myHistory.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No history yet.</p>
                  ) : (
                      <div className="space-y-3">
                          {myHistory.map(m => (
                              <div key={m.id} className="text-sm p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                                      <span className={m.isRead ? 'text-green-600' : 'text-orange-500'}>
                                          {m.isRead ? 'Read' : 'Sent'}
                                      </span>
                                  </div>
                                  <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{m.subject}</p>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
       </div>
    </div>
  );
};

export default CustomerContact;
