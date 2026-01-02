import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const ConfirmModal = ({ isOpen, onClose, options }) => {
  if (!isOpen) return null;

  const { 
    title = "Confirm Action", 
    message = "Are you sure?", 
    type = "confirm", // 'confirm', 'alert', 'danger'
    onConfirm 
  } = options;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-surface border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl overflow-hidden"
      >
        {/* Decorative Blur */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -z-10 ${isDanger ? 'bg-red-500/20' : 'bg-primary/20'}`} />

        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 ${isDanger ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
            {isDanger ? <AlertTriangle size={32} /> : type === 'alert' ? <Info size={32} /> : <CheckCircle size={32} />}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>

          <div className="flex gap-3 w-full">
            {type !== 'alert' && (
              <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition"
              >
                Cancel
              </button>
            )}
            
            <button 
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 ${
                isDanger 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                  : 'bg-primary hover:bg-blue-600 shadow-primary/20'
              }`}
            >
              {type === 'alert' ? 'Okay, Got it' : 'Confirm'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmModal;