import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import userLogin from "../../services/userLogin";
import FormFieldset from "../FormFieldset";

function LoginForm({ onError }) {
  const [{ identifier, password }, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { setAuthState } = useAuth();
  const navigate = useNavigate();

  const inputHandler = (event) => {
    setForm((form) => ({ ...form, [event.target.name]: event.target.value }));
    setErrors((current) => ({ ...current, [event.target.name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {
      identifier: identifier.trim() ? "" : "Email or Username: can't be blank",
      password: password ? "" : "Password: can't be blank",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    onError("");
    setLoading(true);
    try {
      const state = await userLogin({ identifier: identifier.trim(), password });
      setAuthState(state);
      navigate(`/profile/${state.loggedUser.username}`);
    } catch (error) {
      if (error.status === 404) onError("User with such email or username not registered.");
      else if (error.message?.startsWith("Entered Invalid password")) {
        onError(<>{error.message} <Link to="/forgot-password">Send a one-time password to your email?</Link></>);
      } else if (error.message?.includes("verify your email")) {
        onError(<>{error.message} <Link to="/finish-registration" state={{ email: identifier }}>Verify your email</Link></>);
      } else onError(error.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <FormFieldset autoFocus name="identifier" required placeholder="Enter your username or email" autoComplete="username" value={identifier} handler={inputHandler} error={errors.identifier} />
        <FormFieldset name="password" type="password" required placeholder="Password" autoComplete="current-password" preventCopy value={password} handler={inputHandler} error={errors.password} />
        <button className="btn btn-lg btn-primary pull-xs-right" disabled={loading} type="submit">{loading ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="text-xs-center"><Link to="/forgot-password">Forgot the password?</Link></p>
    </>
  );
}

export default LoginForm;
