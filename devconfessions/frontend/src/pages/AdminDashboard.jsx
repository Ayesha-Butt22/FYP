import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  LogOut, 
  Trash2, 
  TrendingUp, 
  MessageCircle,
  Users,
  ArrowLeft
} from 'lucide-react';
import Navbar from '../components/Navbar';
import ConfessionCard from '../components/ConfessionCard';
import SkeletonLoader from '../components/SkeletonLoader';
import confessionService from '../services/confessionService';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [confessions, setConfessions] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, removed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    // Check if admin is authenticated
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [confessionsRes, statsRes] = await Promise.all([
        confessionService.getAllConfessionsAdmin({ status: filter }),
        confessionService.getStats()
      ]);
      setConfessions(confessionsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminService.logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleDelete = (id) => {
    setConfessions(confessions.filter(c => c._id !== id));
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center text-dark-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-dark-400 mt-2">Manage confessions and monitor activity</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Total Confessions</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary-500/20">
                <MessageCircle className="h-6 w-6 text-primary-400" />
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Active Confessions</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.active}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Removed Confessions</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.removed}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/20">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 mb-6">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('removed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'removed'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            Removed
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            All
          </button>
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
              No confessions found
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {confessions.map((confession, index) => (
              <motion.div
                key={confession._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ConfessionCard 
                  confession={confession} 
                  onDelete={handleDelete}
                  isAdmin={true}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
