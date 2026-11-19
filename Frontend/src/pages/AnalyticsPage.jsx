import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import StatsCard from "../components/StatsCard";
import MiniChart from "../components/MiniChart";
import SkeletonLoader from "../components/SkeletonLoader";
import { motion } from "framer-motion";
import {
  CheckCircle, Clock, AlertTriangle, BarChart3,
  TrendingUp, Users, Target, Zap
} from "lucide-react";

const AnalyticsPage = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getTaskStats(token);
        setStats(data.stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) return <div className="page"><SkeletonLoader type="stats" count={4} /></div>;

  const priorityData = [
    { label: "Critical", value: stats?.byPriority?.critical || 0, color: "#ef4444" },
    { label: "High", value: stats?.byPriority?.high || 0, color: "#f97316" },
    { label: "Medium", value: stats?.byPriority?.medium || 0, color: "#eab308" },
    { label: "Low", value: stats?.byPriority?.low || 0, color: "#22c55e" },
  ];

  const statusData = [
    { label: "To Do", value: stats?.todo || 0, color: "#6b7280" },
    { label: "In Progress", value: stats?.inProgress || 0, color: "#3b82f6" },
    { label: "Review", value: stats?.review || 0, color: "#a855f7" },
    { label: "Done", value: stats?.done || 0, color: "#22c55e" },
  ];

  const completedData = (stats?.completedPerDay || []).map((d) => ({
    label: d._id.slice(5), // MM-DD
    value: d.count,
  }));

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Analytics</h1>
          <p className="page__subtitle">Task performance & productivity insights</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          label="Total Tasks"
          value={stats?.total || 0}
          icon={<BarChart3 size={20} />}
          color="#3b82f6"
          delay={0}
        />
        <StatsCard
          label="Completion Rate"
          value={`${stats?.completionRate || 0}%`}
          icon={<TrendingUp size={20} />}
          color="#22c55e"
          delay={0.1}
        />
        <StatsCard
          label="Overdue"
          value={stats?.overdue || 0}
          icon={<AlertTriangle size={20} />}
          color="#ef4444"
          delay={0.2}
        />
        <StatsCard
          label="In Progress"
          value={stats?.inProgress || 0}
          icon={<Clock size={20} />}
          color="#f97316"
          delay={0.3}
        />
      </div>

      {/* Charts Section */}
      <div className="analytics-charts">
        {/* Tasks by Priority - Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="chart-card"
        >
          <h3 className="chart-card__title">Tasks by Priority</h3>
          <MiniChart data={priorityData} type="donut" height={120} />
        </motion.div>

        {/* Tasks by Status - Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="chart-card"
        >
          <h3 className="chart-card__title">Tasks by Status</h3>
          <MiniChart data={statusData} type="donut" height={120} />
        </motion.div>

        {/* Completed Per Day - Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="chart-card chart-card--wide"
        >
          <h3 className="chart-card__title">Tasks Completed (Last 7 Days)</h3>
          {completedData.length > 0 ? (
            <MiniChart data={completedData} type="bar" height={100} color="#22c55e" />
          ) : (
            <div className="chart-card__empty">No data for the last 7 days</div>
          )}
        </motion.div>
      </div>

      {/* Team Productivity */}
      {stats?.tasksPerUser?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="chart-card"
        >
          <h3 className="chart-card__title"><Users size={16} /> Team Productivity</h3>
          <div className="productivity-list">
            {stats.tasksPerUser.map((u, i) => (
              <div key={i} className="productivity-item">
                <div className="productivity-item__avatar">
                  {u.username?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="productivity-item__info">
                  <span className="productivity-item__name">{u.username}</span>
                  <div className="productivity-item__bar-bg">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${u.total > 0 ? (u.done / u.total) * 100 : 0}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                      className="productivity-item__bar"
                    />
                  </div>
                </div>
                <span className="productivity-item__count">{u.done}/{u.total}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsPage;
