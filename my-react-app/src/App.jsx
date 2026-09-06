import { isAdmin } from './utils/permissions';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './components/Login';
import Profile from './components/Profile';
import Header from './components/Header';
import Footer from './components/Footer';
import AppLayout from './components/layout/AppLayout';
import WorkspaceHome from './components/workspace/WorkspaceHome';
import WorkspaceSettings from './components/workspace/WorkspaceSettings';
import ProjectHome from './components/project/ProjectHome';
import ProjectSettings from './components/project/ProjectSettings';
import AppSettings from './components/settings/AppSettings';

function RootRedirect() {
  const { activeWorkspaceId } = useSelector((state) => state.workspaces);
  if (activeWorkspaceId) return <Navigate to={`/workspace/${activeWorkspaceId}`} replace />;
  return (
    <div className="empty-state">
      <h3>Welcome! Create your first workspace</h3>
      <p>Use the workspace switcher in the sidebar to get started.</p>
    </div>
  );
}

// Protected Route for App Settings
function AdminSettingsRoute() {
  const user = useSelector((state) => state.auth.user);
  if (!isAdmin(user)) {
    return <Navigate to="/" replace />; // Redirects non-admins to home
  }
  return <AppSettings />;
}

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return (
      <div className="app-wrapper">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/workspace/:workspaceId" element={<WorkspaceHome />} />
        <Route path="/workspace/:workspaceId/settings" element={<WorkspaceSettings />} />
        <Route path="/workspace/:workspaceId/project/:projectId" element={<ProjectHome />} />
        <Route path="/workspace/:workspaceId/project/:projectId/settings" element={<ProjectSettings />} />
        
        {/* ✅ CHANGED THIS LINE to use the protected route */}
        <Route path="/settings" element={<AdminSettingsRoute />} />
        
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;