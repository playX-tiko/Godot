import React, { useRef } from 'react';
import { Upload, FileCode, X } from 'lucide-react';
import JSZip from 'jszip';
import { ProjectFile } from '../types';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  onFilesLoaded: (files: ProjectFile[]) => void;
  files: ProjectFile[];
  onRemoveFile: (path: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesLoaded, files, onRemoveFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    const newFiles: ProjectFile[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      
      if (file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const content = await zip.loadAsync(file);
        
        for (const [path, zipEntry] of Object.entries(content.files)) {
          if (!zipEntry.dir && (path.endsWith('.gd') || path.endsWith('.tscn') || path.endsWith('.godot'))) {
            const text = await zipEntry.async('string');
            newFiles.push({ name: zipEntry.name, content: text, path });
          }
        }
      } else {
        const text = await file.text();
        newFiles.push({ name: file.name, content: text, path: file.name });
      }
    }

    onFilesLoaded(newFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group relative"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          multiple 
          accept=".zip,.gd,.tscn,.godot" 
          className="hidden" 
        />
        <Upload className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
        
        <div className="mt-4">
          <button 
            type="button"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            إضافة ملفات جودوت
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500 hidden md:block">أو قم بسحب وإفلات الملفات هنا</p>
        <p className="mt-1 text-[10px] text-gray-400">(.zip, .gd, .tscn, .godot)</p>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-row-reverse">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ملفات المشروع ({files.length})</span>
          </div>
          <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {files.map((file) => (
              <li key={file.path} className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors flex-row-reverse">
                <div className="flex items-center space-x-3 space-x-reverse overflow-hidden flex-row-reverse">
                  <FileCode className="h-4 w-4 text-blue-500 flex-shrink-0 ml-3" />
                  <span className="text-sm text-gray-700 truncate font-mono text-right">{file.path}</span>
                </div>
                <button 
                  onClick={() => onRemoveFile(file.path)}
                  className="p-1 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
