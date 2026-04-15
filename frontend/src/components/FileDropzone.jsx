import { useDropzone } from 'react-dropzone'
import { Upload, File, X } from 'lucide-react'

export default function FileDropzone({ onDrop, accept = { 'application/pdf': ['.pdf'] }, file, onClear, label = 'Drop PDF here or click to browse' }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onDrop(files[0]),
    accept,
    maxFiles: 1
  })

  if (file) {
    return (
      <div className="flex items-center gap-3 p-4 border-2 border-blue-300 dark:border-blue-700 rounded-xl bg-blue-50 dark:bg-blue-900/20">
        <File className="w-8 h-8 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{file.name}</p>
          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button onClick={onClear} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      <p className="text-xs text-gray-400 mt-1">PDF files up to 16MB</p>
    </div>
  )
}
