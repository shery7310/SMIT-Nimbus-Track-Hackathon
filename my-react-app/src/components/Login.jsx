import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff } from 'lucide-react';
import { loginSuccess, loginFailure, signupSuccess, clearError } from '../store/authSlice';
import NimbusCloudIcon from './NimbusCloudIcon';
import AuthCarousel from './AuthCarousel';
import '../styles/auth.css';

export default function Login() {
  const dispatch = useDispatch();
  const { error, users } = useSelector((state) => state.auth);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        return !isLogin && !value.trim() ? 'First name is required.' : '';
      case 'lastName':
        return !isLogin && !value.trim() ? 'Last name is required.' : '';
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!emailRegex.test(value)) return 'Enter a valid email address.';
        return '';
      case 'password':
        if (!value) return 'Password is required.';
        if (!isLogin && value.length < 6) return 'Password must be at least 6 characters.';
        return '';
      case 'confirmPassword':
        if (!isLogin && value !== form.password) return 'Passwords do not match.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) dispatch(clearError());
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const runValidation = () => {
    const fieldsToCheck = isLogin
      ? ['email', 'password']
      : ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];

    const nextErrors = {};
    fieldsToCheck.forEach((field) => {
      const msg = validateField(field, form[field]);
      if (msg) nextErrors[field] = msg;
    });
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!runValidation()) {
      triggerShake();
      return;
    }

    setIsSubmitting(true);

    // Small artificial delay so the loading state is visible for local/demo auth
    setTimeout(() => {
      if (isLogin) {
        const found = users.find((u) => u.email === form.email && u.password === form.password);
        if (found) {
          dispatch(loginSuccess(found));
        } else {
          dispatch(loginFailure('Invalid email or password.'));
          triggerShake();
        }
      } else {
        dispatch(signupSuccess({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          role: 'Member',
        }));
        setForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
      }
      setIsSubmitting(false);
    }, 600);
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setFieldErrors({});
    dispatch(clearError());
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-inner">
          <span className="auth-brand">
            <span className="auth-brand-mark">
              <NimbusCloudIcon />
            </span>
            <span className="auth-brand-name">Nimbus Track</span>
          </span>

          <AuthCarousel />
        </div>
      </div>

      <div className="auth-card-wrap">
        <div className={`auth-card ${shake ? 'auth-shake' : ''}`}>
          <h1 className="auth-title">{isLogin ? 'Sign In' : 'Create Account'}</h1>

          <div className="auth-toggle">
            <button type="button" onClick={() => switchMode(true)} className={isLogin ? 'active' : ''}>
              Sign In
            </button>
            <button type="button" onClick={() => switchMode(false)} className={!isLogin ? 'active' : ''}>
              Sign Up
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {!isLogin && (
              <div className="auth-row">
                <div className="auth-group">
                  <label>
                    First Name <span className="auth-required">*</span>
                  </label>
                  <input
                    name="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={form.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`auth-input ${fieldErrors.firstName ? 'auth-input-error' : ''}`}
                  />
                  {fieldErrors.firstName && <p className="auth-field-error">{fieldErrors.firstName}</p>}
                </div>
                <div className="auth-group">
                  <label>
                    Last Name <span className="auth-required">*</span>
                  </label>
                  <input
                    name="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={form.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`auth-input ${fieldErrors.lastName ? 'auth-input-error' : ''}`}
                  />
                  {fieldErrors.lastName && <p className="auth-field-error">{fieldErrors.lastName}</p>}
                </div>
              </div>
            )}

            <div className="auth-group">
              <label>
                Email <span className="auth-required">*</span>
              </label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`}
              />
              {fieldErrors.email && <p className="auth-field-error">{fieldErrors.email}</p>}
            </div>

            <div className="auth-group">
              <label>
                Password <span className="auth-required">*</span>
              </label>
              <div className="auth-password-wrap">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`auth-input ${fieldErrors.password ? 'auth-input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-eye"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}
            </div>

            {!isLogin && (
              <div className="auth-group">
                <label>Confirm Password</label>
                <div className="auth-password-wrap">
                  <input
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Enter your password again"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`auth-input ${fieldErrors.confirmPassword ? 'auth-input-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="auth-eye"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="auth-field-error">{fieldErrors.confirmPassword}</p>}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="auth-spinner" aria-label="Loading" /> : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-demo">
  <p>Owner Demo Accounts:</p>
  <code>m.umair@codevpk.com / Pp@s$word</code>
  <code>shehryarzulfiqar7310@gmail.com / Pp@s$word</code>

  <p style={{ marginTop: 10 }}>Admin Demo Accounts:</p>
  <code>saadthelinuxguy@gmail.com / Pp@s$word</code>
  <code>m.taha7310@gmail.com / Pp@s$word</code>
        </div>
        </div>
      </div>
    </div>
  );
}