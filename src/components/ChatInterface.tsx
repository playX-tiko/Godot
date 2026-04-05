import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Copy, Check, Trash2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  isLoading: boolean;
}

const CodeBlock = ({ children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 p-1.5 bg-gray-800 text-gray-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
        title="Copy code"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </button>
      <pre {...props} className="overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, onClearChat, isLoading }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full min-h-[450px] md:min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">الدردشة</span>
        {messages.length > 0 && (
          <button 
            onClick={onClearChat}
            className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
            title="مسح الدردشة"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot className="h-12 w-12 text-blue-500" />
            <div>
              <p className="text-lg font-medium text-gray-700">كيف يمكنني مساعدتك في مشروع جودوت الخاص بك؟</p>
              <p className="text-sm text-gray-500">اطلب مني إنشاء لاعب، أو التعامل مع المدخلات، أو إصلاح سكربت.</p>
            </div>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[85%] flex space-x-3 space-x-reverse ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-gray-600" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tl-none shadow-md shadow-blue-100' : 'bg-gray-100 text-gray-800 rounded-tr-none shadow-sm'}`}>
                  <div className={cn(
                    "prose prose-sm max-w-none text-right",
                    msg.role === 'user' ? "prose-p:text-white prose-headings:text-white prose-strong:text-white prose-code:bg-blue-500 prose-code:text-white" : "prose-p:text-gray-800 prose-headings:text-gray-900"
                  )}>
                    <Markdown components={{ pre: CodeBlock }}>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-gray-100 text-gray-500 text-sm italic">
                جاري التفكير...
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="mb-2 text-[10px] text-gray-400 text-center">
          انسخ الأكواد الناتجة والصقها في محرك جودوت يدوياً
        </div>
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="مثال: أنشئ سكربت لاعب 2D مع حركة..."
            className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-right"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
