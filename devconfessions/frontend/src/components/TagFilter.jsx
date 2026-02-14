import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const TagFilter = ({ selectedTag, onTagSelect, onClearFilter }) => {
  const tags = [
    'Frontend', 'Backend', 'DevOps', 'Career', 'JavaScript',
    'React', 'Node.js', 'Database', 'API', 'Testing', 'Security', 'AI/ML'
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-dark-400">Filter by Tag</h3>
        {selectedTag && (
          <button
            onClick={onClearFilter}
            className="flex items-center text-xs text-dark-500 hover:text-primary-400 transition-colors"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filter
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <motion.button
            key={tag}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTagSelect(selectedTag === tag ? null : tag)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedTag === tag
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-dark-200 border border-dark-700'
            }`}
          >
            {tag}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default TagFilter;
