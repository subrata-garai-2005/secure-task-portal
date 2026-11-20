import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ActivityTimeline from "../components/ActivityTimeline";
import SkeletonLoader from "../components/SkeletonLoader";
import { motion } from "framer-motion";
import { Activity, Search } from "lucide-react";

const ActivityPage = () => {
  const { token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchActivity = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getActivity(token, 100);
      setActivities(data.activities || []);
    } catch (err) {
      console.error("Failed to fetch activity:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const filtered = filter.trim()
    ? activities.filter((a) =>
        a.action?.toLowerCase().includes(filter.toLowerCase()) ||
        a.detail?.toLowerCase().includes(filter.toLowerCase()) ||
        a.ip?.toLowerCase().includes(filter.toLowerCase())
      )
    : activities;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title flex items-center gap-2">
            <Activity size={22} className="text-emerald-400" />
            Audit & Activity Logs
          </h1>
          <p className="page__subtitle">{activities.length} recorded events with client provenance</p>
        </div>
      </div>

      {/* Filter */}
      <div className="page__filters">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by event (LOGIN, TASK, ATTACK, IP)..."
            className="search-bar__input"
          />
          {filter && (
            <button onClick={() => setFilter("")} className="search-bar__clear">✕</button>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonLoader type="table" count={10} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ActivityTimeline activities={filtered} />
        </motion.div>
      )}
    </div>
  );
};

export default ActivityPage;
