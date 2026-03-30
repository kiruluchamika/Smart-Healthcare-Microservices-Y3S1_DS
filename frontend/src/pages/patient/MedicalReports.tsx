import React, { useState, useEffect } from 'react';
import { patientApi } from '../../services/patientApi';
import { MedicalReport, ReportType } from '../../types/patient';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, FileText, UploadCloud, X, Folder, AlertCircle } from 'lucide-react';

const MedicalReports: React.FC = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload Form State
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reportType, setReportType] = useState<ReportType>('LAB_REPORT');
  const [reportDate, setReportDate] = useState('');
  const [uploading, setUploading] = useState(false);

  const reportTypeOptions: Record<ReportType, string> = {
    LAB_REPORT: '🔍 Lab Report',
    PRESCRIPTION: '💊 Prescription',
    DIAGNOSIS: '📄 Diagnosis',
    VACCINATION: '💉 Vaccination',
    IMAGING: '🩻 Imaging/MRI',
    OTHER: '📁 Other Document'
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await patientApi.getReports();
      if (res.success) {
        setReports(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch medical reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    try {
      setUploading(true);
      setError(null);
      const res = await patientApi.uploadReport(file, title, reportType, description, reportDate);
      if (res.success) {
        setReports([res.data, ...reports]); // prepend
        setShowUpload(false);
        // Reset
        setFile(null);
        setTitle('');
        setDescription('');
        setReportType('LAB_REPORT');
        setReportDate('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to upload report. The file may be too large.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you certain you want to permanently delete this report?')) return;
    try {
      const res = await patientApi.deleteReport(id);
      if (res.success) {
         setReports(reports.filter(r => r.id !== id));
      }
    } catch (err: any) {
      setError('Failed to delete report.');
    }
  };

  const handleDownload = async (id: number, fileName: string) => {
    try {
      const response = await patientApi.downloadReportBlob(id);
      // Create memory url
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      setError('Failed to download the document stream.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1000;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Folder className="w-8 h-8" /></div>
               Diagnostic Vault
            </h1>
            <p className="mt-2 text-gray-500 text-lg">Safely upload, manage, and download all your patient records.</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-md text-white bg-blue-600 hover:bg-blue-700 transition-all font-bold group transform hover:-translate-y-0.5"
          >
            {showUpload ? <X className="w-5 h-5"/> : <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            {showUpload ? 'Close Uploader' : 'Upload New Report'}
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showUpload && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl mb-10 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-0 opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-6 relative z-10 flex items-center gap-2">
                 <UploadCloud className="text-blue-500 w-6 h-6"/> File Upload Center
              </h3>
              
              <form onSubmit={handleUpload} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Document Title *</label>
                     <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g. Full Blood Count - March 2026" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Report Category</label>
                    <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                      {Object.entries(reportTypeOptions).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date conducted</label>
                    <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select File *</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="space-y-2 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex justify-center text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-3 py-1 shadow-sm border border-gray-200">
                            <span>Upload a file</span>
                            <input type="file" required onChange={handleFileChange} className="sr-only" />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">{file ? <span className="text-blue-600 font-bold">{file.name}</span> : "PDF, PNG, JPG up to 10MB"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Description</label>
                    <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide any extra details" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none" />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="button" onClick={() => setShowUpload(false)} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 mr-4 font-medium transition-colors">Cancel</button>
                  <button type="submit" disabled={uploading || !file || !title} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {uploading ? 'Processing...' : 'Upload File to Vault'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing Reports List */}
        {loading ? (
           <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Your vault is empty</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">You haven't uploaded any medical reports yet. Click the upload button to store your first document securely.</p>
            <button onClick={() => setShowUpload(true)} className="px-6 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100">Upload Now</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
            {reports.map((report) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow overflow-hidden group flex flex-col"
              >
                <div className="p-6 flex-1">
                   <div className="flex justify-between items-start mb-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                         {reportTypeOptions[report.reportType]}
                      </span>
                      {report.reportDate && <span className="text-xs text-gray-400 font-medium">{report.reportDate}</span>}
                   </div>
                   <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">{report.title}</h3>
                   <div className="text-xs text-gray-500 flex flex-col gap-1 mb-4">
                     <span className="truncate" title={report.originalFileName}>📄 {report.originalFileName}</span>
                     <span>💾 {formatFileSize(report.fileSize)}</span>
                   </div>
                   {report.description && <p className="text-sm text-gray-600 line-clamp-3 bg-gray-50 p-2 rounded-lg italic">"{report.description}"</p>}
                </div>
                
                {/* Actions Ribbon */}
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between">
                   <p className="text-xs text-gray-400">Added: {new Date(report.uploadedAt).toLocaleDateString()}</p>
                   <div className="flex items-center gap-2">
                      <button onClick={() => handleDownload(report.id, report.originalFileName)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors group-hover:scale-110" title="Download secure copy">
                        <Download className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(report.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Delete report permanently">
                        <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalReports;
