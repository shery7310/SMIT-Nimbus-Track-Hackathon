import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, switchUser, updateProfile } from '../store/authSlice';
import '../styles/auth.css';

export default function Profile() {
  const dispatch = useDispatch();
  const { user, users } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  const otherUsers = users.filter((u) => u.id !== user.id);

  const handleSave = () => {
    dispatch(updateProfile(editForm));
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>

          <div className="profile-info">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h2>{user.firstName} {user.lastName}</h2>
                <p>{user.email}</p>
                <span className="profile-role">{user.role}</span>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="profile-edit-btn"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {isEditing && (
              <div className="profile-edit-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label>First Name</label>
                    <input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Last Name</label>
                    <input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <button onClick={handleSave} className="profile-save-btn">
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {otherUsers.length > 0 && (
          <div className="profile-section">
            <h3>Switch Account</h3>
            <div className="user-switch-list">
              {otherUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => dispatch(switchUser(u.id))}
                  className="user-switch-item"
                >
                  <div className="user-switch-avatar">
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                  <div className="user-switch-info">
                    <p className="user-switch-name">{u.firstName} {u.lastName}</p>
                    <p className="user-switch-email">{u.email}</p>
                  </div>
                  <span className="user-switch-arrow">Switch →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="profile-logout">
          <button onClick={() => dispatch(logout())} className="profile-logout-btn">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}