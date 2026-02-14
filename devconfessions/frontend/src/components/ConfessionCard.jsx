import { motion } from 'framer-motion';
import { Heart, Clock, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import confessionService from '../services/confessionService';
import toast from 'react-hot-toast';

const ConfessionCard = ({ confession, onDelete, isAdmin = false }) => {
  const [likes, setLikes] = useState(confession.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return past.toLocaleDateString();
  };

  const handleLike = async () => {
    if (hasLiked || isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await confessionService.likeConfession(confession._id);
      setLikes(response.data.likes);
      setHasLiked(true);
      toast.success('Liked!', { icon: '❤️' });
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to like');
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove this confession?')) return;
    
    try {
      await confessionService.deleteConfession(confession._id);
      toast.success('Confession removed');
      if (onDelete) onDelete(confession._id);
    } catch (error) {
      toast.error('Failed to remove confession');
    }
  };

  const tagColors = {
    Frontend: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Backend: 'bg-green-500/20 text-green-400 border-green-500/30',
    DevOps: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Career: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    JavaScript: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    React: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Node.js': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Database: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    API: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    Testing: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    Security: 'bg-red-500/20 text-red-400 border-red-500/30',
    'AI/ML': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
    >
      {/* Confession Text */}
      <p className="text-lg text-dark-100 mb-4 leading-relaxed">
        {confession.text}
      </p>

      {/* Tags */}
      {confession.tags && confession.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {confession.tags.map((tag, index) => (
            <span
              key={index}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                tagColors[tag] || 'bg-dark-700 text-dark-300 border-dark-600'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-700">
        <div className="flex items-center space-x-4">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={hasLiked || isLiking}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
              hasLiked
                ? 'bg-red-500/20 text-red-400'
                : 'hover:bg-dark-700 text-dark-400 hover:text-red-400'
            } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart
              className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`}
            />
            <span className="text-sm font-medium">{likes}</span>
          </button>

          {/* Time */}
          <div className="flex items-center space-x-1 text-dark-500">
            <Clock className="h-4 w-4" />
            <span className="text-xs">{formatTimeAgo(confession.createdAt)}</span>
          </div>
        </div>

        {/* Admin Delete Button */}
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
          >
            Remove
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ConfessionCard;
