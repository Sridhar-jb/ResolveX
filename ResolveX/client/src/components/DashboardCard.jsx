function DashboardCard({ title, value }) {
  return (
    <div className="rx-admin-stat">
      <div><span>STAT</span><small>{title}</small></div>
      <strong>{value}</strong>
      <p>Current workspace count</p>
    </div>
  );
}
export default DashboardCard;
