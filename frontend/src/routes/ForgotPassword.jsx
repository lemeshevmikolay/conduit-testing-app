import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormFieldset from "../components/FormFieldset";
import { validateEmail, validatePassword } from "../helpers/validation";
import requestPasswordReset from "../services/requestPasswordReset";
import resetPassword from "../services/resetPassword";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [requested, setRequested] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestCode = async (event) => {
    event.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) return setErrors({ email: emailError });
    setLoading(true);
    setErrors({});
    try {
      setMessage(await requestPasswordReset(email.trim()));
      setRequested(true);
    } catch (error) {
      setErrors({ email: error.message });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    const nextErrors = {
      code: /^\d{6}$/.test(code) ? "" : "Enter the 6-digit code.",
      password: validatePassword(password),
      confirmPassword: password === confirmPassword ? "" : "Passwords do not match.",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), code, password });
      navigate("/login", { replace: true, state: { message: "Password updated. Sign in with your new password." } });
    } catch (error) {
      setErrors({ code: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container page">
      <div className="col-md-6 offset-md-3 col-xs-12">
        <h1 className="text-xs-center">Forgot password</h1>
        <p className="text-xs-center"><Link to="/login">Back to Sign In</Link></p>
        {message && <p role="status">{message}</p>}
        {!requested ? (
          <form onSubmit={requestCode} noValidate>
            <FormFieldset autoFocus type="email" name="email" required placeholder="Email" autoComplete="email" value={email} handler={(event) => setEmail(event.target.value)} error={errors.email} />
            <button className="btn btn-lg btn-primary pull-xs-right" disabled={loading} type="submit">{loading ? "Sending…" : "Send one-time password"}</button>
          </form>
        ) : (
          <form onSubmit={changePassword} noValidate>
            <p>Test code: <strong>123456</strong></p>
            <FormFieldset name="code" required placeholder="6-digit code" maxLength={6} value={code} handler={(event) => setCode(event.target.value.replace(/\D/g, ""))} error={errors.code} />
            <FormFieldset name="password" type="password" required placeholder="New password" autoComplete="new-password" minLength={8} maxLength={30} preventCopy value={password} handler={(event) => setPassword(event.target.value)} error={errors.password} />
            <FormFieldset name="confirmPassword" type="password" required placeholder="Confirm new password" autoComplete="new-password" minLength={8} maxLength={30} preventCopy value={confirmPassword} handler={(event) => setConfirmPassword(event.target.value)} error={errors.confirmPassword} />
            <button className="btn btn-lg btn-primary pull-xs-right" disabled={loading} type="submit">{loading ? "Updating…" : "Update password"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
