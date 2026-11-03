import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import verifyEmail from "../services/verifyEmail";
import FormFieldset from "../components/FormFieldset";

function FinishRegistration() {
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuthState } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return setError("Email can't be blank.");
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit verification code.");
    setLoading(true);
    setError("");
    try {
      const auth = await verifyEmail({ email: email.trim(), code });
      setAuthState(auth);
      navigate(`/profile/${auth.loggedUser.username}`, { replace: true });
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container page">
      <div className="col-md-6 offset-md-3 col-xs-12">
        <h1 className="text-xs-center">Finish registration</h1>
        <p className="text-xs-center">Enter the 6-digit code sent to your email. This test build uses mock code <strong>123456</strong>.</p>
        {error && <p className="error-messages" role="alert">{error}</p>}
        <form onSubmit={handleSubmit} noValidate>
          <FormFieldset type="email" name="email" required placeholder="Email" autoComplete="email" value={email} handler={(event) => setEmail(event.target.value)} />
          <FormFieldset autoFocus name="code" required placeholder="6-digit verification code" maxLength={6} value={code} handler={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
          <button className="btn btn-lg btn-primary pull-xs-right" disabled={loading} type="submit">{loading ? "Verifying…" : "Verify email"}</button>
        </form>
      </div>
    </div>
  );
}

export default FinishRegistration;
