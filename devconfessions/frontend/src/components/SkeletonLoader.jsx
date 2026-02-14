import { motion } from 'framer-motion';

const SkeletonCard = () => (
  <motion.div
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
    className="glass rounded-xl p-6"
  >
    {/* Text skeleton */}
    <div className="space-y-3 mb-4">
      <div className="h-4 bg-dark-700 rounded w-full" />
      <div className="h-4 bg-dark-700 rounded w-5/6" />
      <div className="h-4 bg-dark-700 rounded w-4/6" />
    </div>

    {/* Tags skeleton */}
    <div className="flex gap-2 mb-4">
      <div className="h-6 w-16 bg-dark-700 rounded-full" />
      <div className="h-6 w-20 bg-dark-700 rounded-full" />
    </div>

    {/* Actions skeleton */}
    <div className="flex items-center justify-between pt-4 border-t border-dark-700">
      <div className="flex items-center space-x-4">
        <div className="h-6 w-12 bg-dark-700 rounded" />
        <div className="h-4 w-16 bg-dark-700 rounded" />
      </div>
    </div>
  </motion.div>
);

const SkeletonLoader = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export default SkeletonLoader;
