
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import "./Login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-visual">
        <div className="login-brand">
          <span className="login-brand-icon">
            <UtensilsCrossed size={24} />
          </span>
          <span>
            <strong>DineFlow</strong>
            <small>THE ART OF DINING</small>
          </span>
        </div>

        <div className="login-hero-copy">
          <span className="login-eyebrow">
            <span />
            RESTAURANT MANAGEMENT REIMAGINED
          </span>

          <h1>
            Exceptional dining.
            <br />
            <em>Thoughtfully managed.</em>
          </h1>

          <p>
            Bring your kitchen, guests, inventory and daily operations
            together in one considered workspace.
          </p>
        </div>

        <div className="login-image-caption">
          <span>THE DINEFLOW EXPERIENCE</span>
          <strong>Every detail matters.</strong>
        </div>
      </section>

      <section className="login-form-side">
        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            <UtensilsCrossed size={21} />
            <span>DineFlow</span>
          </div>

          <div className="login-welcome">
            <span className="login-form-eyebrow">
              <ShieldCheck size={15} />
              SECURE ADMIN ACCESS
            </span>

            <h2>Welcome back.</h2>
            <p>Sign in to your restaurant workspace.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="Enter your admin email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              required
            />

            <label htmlFor="login-password">Password</label>

            <div className="login-password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in to DineFlow"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="login-security-note">
            <ShieldCheck size={17} />
            <span>
              Protected workspace. Access is available to authorized
              restaurant accounts only.
            </span>
          </div>

          <p className="login-footer">
            DINEFLOW · THE ART OF DINING
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
