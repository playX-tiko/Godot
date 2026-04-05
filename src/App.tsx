import { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { ChatInterface } from './components/ChatInterface';
import { ProjectFile, ChatMessage } from './types';
import { GodotAIService } from './services/ai';
import { Code2, Settings, Github, Info, AlertCircle, Download } from 'lucide-react';
import { motion } from 'motion/react';
import JSZip from 'jszip';

export default function App() {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiService, setAiService] = useState<GodotAIService | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const service = new GodotAIService();
      setAiService(service);
    } catch (err) {
      setError("مفتاح Gemini API مفقود. يرجى إضافته في لوحة Secrets.");
    }
  }, []);

  const handleFilesLoaded = (newFiles: ProjectFile[]) => {
    setFiles(prev => {
      const existingPaths = new Set(prev.map(f => f.path));
      const filteredNew = newFiles.filter(f => !existingPaths.has(f.path));
      return [...prev, ...filteredNew];
    });
  };

  const handleRemoveFile = (path: string) => {
    setFiles(prev => prev.filter(f => f.path !== path));
  };

  const downloadProject = async () => {
    if (files.length === 0) return;
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.path, file.content);
    });
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = "godot_project_updated.zip";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (text: string) => {
    if (!aiService) return;

    const userMessage: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let currentResponse = "";
      setMessages(prev => [...prev, { role: 'model', text: "" }]);

      await aiService.generateGodotContent(text, files, (chunk) => {
        currentResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', text: currentResponse };
          return newMessages;
        });
      });
    } catch (err: any) {
      console.error(err);
      let errorMessage = "عذراً، حدث خطأ أثناء توليد المحتوى. يرجى التحقق من مفتاح API والاتصال.";
      
      if (err?.status === "RESOURCE_EXHAUSTED" || err?.message?.includes("429")) {
        errorMessage = "لقد تجاوزت حصة الاستخدام المسموح بها حالياً (Quota Exceeded). يرجى الانتظار قليلاً ثم المحاولة مرة أخرى، أو التحقق من حدود حسابك في Google AI Studio.";
      }
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'model', text: errorMessage };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">معماري جودوت الذكي</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">مدعوم بـ Gemini 3.1 Pro</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            {files.length > 0 && (
              <button 
                onClick={downloadProject}
                className="hidden md:flex items-center space-x-2 space-x-reverse px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>تحميل المشروع المحدث</span>
              </button>
            )}
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <Github className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:h-[calc(100vh-8rem)]">
        {/* Left Sidebar: File Management */}
        <div className="lg:col-span-4 space-y-6 flex flex-col overflow-y-auto lg:overflow-hidden pr-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-shrink-0"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                <Info className="h-4 w-4 ml-2" /> سياق المشروع
              </h2>
              {files.length > 0 && (
                <button 
                  onClick={downloadProject}
                  className="md:hidden flex items-center space-x-1 space-x-reverse text-blue-600 text-xs font-bold"
                >
                  <Download className="h-3 w-3" />
                  <span>تحميل ZIP</span>
                </button>
              )}
            </div>
            <FileUploader 
              onFilesLoaded={handleFilesLoaded} 
              files={files} 
              onRemoveFile={handleRemoveFile} 
            />
          </motion.div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-600">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="mt-auto space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>نصيحة:</strong> ارفع ملفات <code>.gd</code> أو <code>.tscn</code> لتعريف الذكاء الاصطناعي على هيكلية مشروعك.
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center">
                <Info className="h-3 w-3 mr-1" /> كيف يعمل؟
              </h3>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                الذكاء الاصطناعي لا يمكنه تعديل ملفاتك مباشرة على جهازك. سيقوم بإنشاء الأكواد هنا في الدردشة، وعليك <strong>نسخها ولصقها</strong> في محرك جودوت (Godot) يدوياً.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content: Chat Interface */}
        <div className="lg:col-span-8 h-full min-h-[500px]">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            onClearChat={() => setMessages([])}
            isLoading={isLoading} 
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-center text-gray-400 text-sm border-t border-gray-200 bg-white">
        <p>© 2026 معماري جودوت الذكي • تم البناء بواسطة Gemini</p>
      </footer>
    </div>
  );
}
