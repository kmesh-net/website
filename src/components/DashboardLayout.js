import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import { useLocation } from "@docusaurus/router";
import "../css/dashboard.css";

const SIDEBAR_ITEMS = [
  { label: "Overview", path: "/dashboard" },
  { label: "Topology", path: "/dashboard/topology" },
  { label: "Waypoints", path: "/dashboard/waypoints" },
  { label: "Policies", path: "/dashboard/policies" },
  { label: "Metrics", path: "/dashboard/metrics" },
];

export default function DashboardLayout({ children, title }) {
  const location = useLocation();

  return (
    <Layout title={title || "Dashboard"}>
      <div className="dashboard-container">
        <aside className="dashboard-sidebar">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname === item.path + "/";
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`dashboard-sidebar-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </aside>
        <main className="dashboard-content">{children}</main>
      </div>
    </Layout>
  );
}
