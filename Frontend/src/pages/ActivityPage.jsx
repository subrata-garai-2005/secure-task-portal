import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ActivityTimeline from "../components/ActivityTimeline";
import SkeletonLoader from "../components/SkeletonLoader";
import { motion } from "framer-motion";
import { Activity, Filter } from "lucide-react";

const ActivityPage = () => {
  const { token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await api.getActivity(token, 100);
        setActivities(data.activities || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [token]);

  const filtered = filter
    ? activities.filter((a) => a.action?.toLowerCase().includes(filter.toLowerCase()))
    : activities;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">
            <Activity size={24} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
            Activity Feed
          </h1>
          <p className="page__subtitle">{activities.length} recorded events</p>
        </div>
      </div>

      {/* Filter */}
      <div className="page__filters">
        <div className="search-bar">
          <Filter size={16} />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by action type (login, create, attack...)"
            className="search-bar__input"
          />
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
