import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import confessionService from '../services/confessionService';
import toast from 'react-hot-toast';

const CreateConfessionModal = ({ isOpen, onClose, onSuccess }) => {
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = [
    'Frontend', 'Backend', 'DevOps', 'Career', 'JavaScript',
    'React', 'Node.js', 'Database', 'API', 'Testing', 'Security', 'AI/ML'
  ];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      toast.error('Please enter your confession');
      return;
    }

    if (text.length > 500) {
      toast.error('Confession cannot exceed 500 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await confessionService.createConfession({
        text: text.trim(),
        tags: selectedTags
      });
      toast.success('Confession posted successfully!');
      setText('');
      setSelectedTags([]);
      onSuccess();
      onClose();
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to post confession');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-dark rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Share Your Confession
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <X className="h-5 w-5 text-dark-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Text Area */}
                <div className="mb-4">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What's your confession? (max 500 characters)"
                    className="w-full h-40 px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                    maxLength={500}
                  />
                  <div className="text-right text-sm text-dark-500 mt-1">
                    {text.length}/500
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-400 mb-2">
                    Select up to 3 tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedTags.includes(tag)
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !text.trim()}
                  className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-200 ${
                    isSubmitting || !text.trim()
                      ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:opacity-90'
                  }`}
                >
                  {isSubmitting ? (
                    <span>Posting...</span>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Post Confession</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateConfessionModal;
