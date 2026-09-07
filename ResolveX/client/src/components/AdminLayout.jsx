import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import AdminChatWidget from "./AdminChatWidget";
import ThreeDScene from "./ThreeDScene";

function AdminLayout({ children }) {
  return (
    <div className="rx-app rx-app-3d">
      <ThreeDScene variant="ambient" />
      <Navbar />
      <div className="rx-body">
        <Sidebar />
        <main className="rx-main">{children}</main>
      </div>
      <AdminChatWidget />
    </div>
  );
}

export default AdminLayout;
