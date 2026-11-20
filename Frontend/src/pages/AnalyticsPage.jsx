import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import StatsCard from "../components/StatsCard";
import MiniChart from "../components/MiniChart";
import SkeletonLoader from "../components/SkeletonLoader";
import { motion } from "framer-motion";
import {
  Clock, AlertTriangle, BarChart3,
  TrendingUp, Users
} from "lucide-react";

const AnalyticsPage = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getTaskStats(token);
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title">Analytics & Insights</h1>
        </div>
        <SkeletonLoader type="stats" count={4} />
      </div>
    );
  }

  const priorityData = [
    { label: "Critical", value: stats?.byPriority?.critical || 0, color: "#FF5B5B" },
    { label: "High", value: stats?.byPriority?.high || 0, color: "#FEC53D" },
    { label: "Medium", value: stats?.byPriority?.medium || 0, color: "#4880FF" },
    { label: "Low", value: stats?.byPriority?.low || 0, color: "#00B69B" },
  ];

  const statusData = [
    { label: "To Do", value: stats?.todo || 0, color: "#64748B" },
    { label: "In Progress", value: stats?.inProgress || 0, color: "#4880FF" },
    { label: "Review", value: stats?.review || 0, color: "#FEC53D" },
    { label: "Done", value: stats?.done || 0, color: "#00B69B" },
  ];

  const completedData = (stats?.completedPerDay || []).map((d) => ({
    label: d._id.slice(5), // MM-DD
    value: d.count,
  }));

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Analytics & Insights</h1>
          <p className="page__subtitle">Task throughput, completion velocity and workload telemetry</p>
        </div>
      </div>

      {/* DashStack KPI Cards */}
      <div className="stats-grid">
        <StatsCard
          label="Total Tasks"
          value={stats?.total || 0}
          icon={<BarChart3 size={24} />}
          color="#4880FF"
          trend={8.5}
          trendText="Up from yesterday"
          delay={0}
        />
        <StatsCard
          label="Completion Rate"
          value={`${stats?.completionRate || 0}%`}
          icon={<TrendingUp size={24} />}
          color="#00B69B"
          trend={2.4}
          trendText="Up from last week"
          delay={0.05}
        />
        <StatsCard
          label="Overdue Tasks"
          value={stats?.overdue || 0}
          icon={<AlertTriangle size={24} />}
          color="#FF5B5B"
          trend={-1.5}
          trendText="Down from yesterday"
          delay={0.1}
        />
        <StatsCard
          label="In Progress"
          value={stats?.inProgress || 0}
          icon={<Clock size={24} />}
          color="#FEC53D"
          trend={4.0}
          trendText="Active workload"
          delay={0.15}
        />
      </div>

      {/* Charts Section */}
      <div className="analytics-charts">
        {/* Tasks by Priority - Donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="chart-card"
        >
          <h3 className="chart-card__title">Distribution by Priority</h3>
          <MiniChart data={priorityData} type="donut" height={120} />
        </motion.div>

        {/* Tasks by Status - Donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="chart-card"
        >
          <h3 className="chart-card__title">Pipeline by Status</h3>
          <MiniChart data={statusData} type="donut" height={120} />
        </motion.div>

        {/* Completed Per Day - Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="chart-card chart-card--wide"
        >
          <h3 className="chart-card__title">Tasks Completed (Last 7 Days)</h3>
          {completedData.length > 0 ? (
            <MiniChart data={completedData} type="bar" height={100} color="#34d399" />
          ) : (
            <div className="chart-card__empty">No completions recorded in the last 7 days</div>
          )}
        </motion.div>
      </div>

      {/* Team Productivity */}
      {stats?.tasksPerUser?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="chart-card mt-6"
        >
          <h3 className="chart-card__title flex items-center gap-2">
            <Users size={16} /> Team Workload & Completion
          </h3>
          <div className="productivity-list">
            {stats.tasksPerUser.map((u, i) => (
              <div key={i} className="productivity-item">
                <div className="productivity-item__avatar">
                  {u.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="productivity-item__info">
                  <span className="productivity-item__name">{u.username}</span>
                  <div className="productivity-item__bar-bg">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${u.total > 0 ? (u.done / u.total) * 100 : 0}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
                      className="productivity-item__bar"
                    />
                  </div>
                </div>
                <span className="productivity-item__count font-mono text-xs">{u.done} / {u.total} done</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsPage;
