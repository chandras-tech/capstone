import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
}

export default function DropZone({ onFile, loading }: Props) {
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) onFile(accepted[0]);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: loading,
  });

  return (
    <div {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
        ${isDragActive
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-gray-700 hover:border-purple-600/60 hover:bg-purple-900/10'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input {...getInputProps()} />
      <div className="text-5xl mb-4">{loading ? '⏳' : isDragActive ? '📂' : '📄'}</div>
      {loading ? (
        <div>
          <p className="text-white font-semibold mb-1">Processing — please wait…</p>
          <p className="text-gray-400 text-sm mb-2">Claude AI is reading and categorizing your transactions</p>
          <p className="text-gray-600 text-xs">PDF files take 2–4 minutes · CSV files take ~15 seconds</p>
          <div className="mt-3 flex justify-center gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-white font-semibold mb-1">
            {isDragActive ? 'Drop it here!' : 'Drag & drop your statement'}
          </p>
          <p className="text-gray-400 text-sm mb-4">PDF or CSV from any major bank</p>
          <div className="flex items-center justify-center gap-3">
            <span className="px-3 py-1 bg-[#1a1a2e] border border-gray-700 rounded-lg text-xs text-gray-400">PDF</span>
            <span className="px-3 py-1 bg-[#1a1a2e] border border-gray-700 rounded-lg text-xs text-gray-400">CSV</span>
          </div>
          <p className="text-gray-600 text-xs mt-4">Chase · Amex · Wells Fargo · Capital One · Citi</p>
        </div>
      )}
    </div>
  );
}
