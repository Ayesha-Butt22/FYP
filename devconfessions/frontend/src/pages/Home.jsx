import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, Clock, Flame } from 'lucide-react';
import Navbar from '../components/Navbar';
import ConfessionCard from '../components/ConfessionCard';
import CreateConfessionModal from '../components/CreateConfessionModal';
import TagFilter from '../components/TagFilter';
import SkeletonLoader from '../components/SkeletonLoader';
import confessionService from '../services/confessionService';
import toast from 'react-hot-toast';

const Home = () => {
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(null);
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchConfessions = async (pageNum = 1, append = false) => {
    try {
      const params = {
        page: pageNum,
        limit: 10,
        sort: sortBy,
      };
      
      if (selectedTag) {
        params.tag = selectedTag;
      }

      const response = await confessionService.getConfessions(params);
      
      if (append) {
        setConfessions((prev) => [...prev, ...response.data]);
      } else {
        setConfessions(response.data);
      }
      
      setHasMore(response.data.length === 10);
      setPage(pageNum);
    } catch (error) {
      toast.error('Failed to load confessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchConfessions(1, false);
  }, [selectedTag, sortBy]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchConfessions(page + 1, true);
    }
  };

  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
    setPage(1);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
  };

  const handleConfessionCreated = () => {
    fetchConfessions(1, false);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent">
              Dev Confessions
            </span>
          </motion.h1>
          <p className="text-dark-400 text-lg">
            Share your anonymous developer confessions
          </p>
        </div>

        {/* Create Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary-500/25"
          >
            <Plus className="h-5 w-5" />
            <span>Share Your Confession</span>
          </button>
        </motion.div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-200">Confessions</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSortChange('latest')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'latest'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <Clock className="h-4 w-4 mr-1" />
                Latest
              </button>
              <button
                onClick={() => handleSortChange('top')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'top'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <Flame className="h-4 w-4 mr-1" />
                Top
              </button>
            </div>
          </div>

          <TagFilter
            selectedTag={selectedTag}
            onTagSelect={handleTagSelect}
            onClearFilter={() => handleTagSelect(null)}
          />
        </div>

        {/* Confessions List */}
        {loading ? (
          <SkeletonLoader count={5} />
        ) : confessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-dark-500 text-lg">
              No confessions yet. Be the first to share!
            </p>
          </motion.div>
        ) : (
          <>
            <div className="space-y-4">
              <AnimatePresence>
                {confessions.map((confession, index) => (
                  <motion.div
                    key={confession._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ConfessionCard confession={confession} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 rounded-lg bg-dark-800 text-dark-300 hover:bg-dark-700 transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Modal */}
      <CreateConfessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleConfessionCreated}
      />
    </div>
  );
};

export default Home;
