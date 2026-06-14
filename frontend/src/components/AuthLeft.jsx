export default function AuthLeft() {
  return (
    <div className="auth-left">
      <div className="auth-left-inner">
        <div className="auth-brand">
          <div className="auth-brand-logo">✓</div>
          <span className="auth-brand-name">TaskManager</span>
        </div>
        <h1 className="auth-left-title">
          Manage tasks.<br />Stay productive.
        </h1>
        <p className="auth-left-sub">
          A clean, powerful workspace to organize your work, track progress, and never miss a deadline.
        </p>
        <ul className="auth-features">
          <li className="auth-feature">
            <div className="auth-feature-dot">✓</div>
            <span>Create &amp; prioritize tasks in seconds</span>
          </li>
          <li className="auth-feature">
            <div className="auth-feature-dot">✓</div>
            <span>Search &amp; filter — find anything instantly</span>
          </li>
          <li className="auth-feature">
            <div className="auth-feature-dot">✓</div>
            <span>Live stats dashboard — always in control</span>
          </li>
          <li className="auth-feature">
            <div className="auth-feature-dot">✓</div>
            <span>Secure JWT auth — your data, only yours</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
