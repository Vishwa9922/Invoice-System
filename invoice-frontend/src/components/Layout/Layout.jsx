import Sidebar from './Sidebar';
import Navbar  from './Navbar';

const Layout = ({ children }) => (
  <div className="flex min-h-screen bg-gray-100">
    <Sidebar />
    <div className="ml-60 flex-1 flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  </div>
);

export default Layout;