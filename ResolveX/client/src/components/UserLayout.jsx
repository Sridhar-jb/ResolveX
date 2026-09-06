import Navbar from "./Navbar";
import UserSidebar from "./UserSidebar";
import SupportChatWidget from "./SupportChatWidget";
import ThreeDScene from "./ThreeDScene";

function UserLayout({ children }) {
  return (
    <div className="rx-app rx-app-3d">
      <ThreeDScene variant="ambient" />
      <Navbar />
      <div className="rx-body">
        <UserSidebar />
        <main className="rx-main">{children}</main>
      </div>
      <SupportChatWidget />
    </div>
  );
}

export default UserLayout;
