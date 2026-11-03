import { useState } from "react";
import { useNavigate } from "react-router-dom";
import userSignUp from "../../services/userSignUp";
import { validateEmail, validatePassword, validateUsername } from "../../helpers/validation";
import FormFieldset from "../FormFieldset";

function SignUpForm({ onError }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = (values) => ({
    username: validateUsername(values.username),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    confirmPassword: values.confirmPassword === values.password ? "" : "Passwords do not match.",
  });

  const inputHandler = (event) => {
    const next = { ...form, [event.target.name]: event.target.value };
    setForm(next);
    setErrors((current) => current[event.target.name] ? { ...current, ...validate(next) } : current);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) return;
    onError("");
    setLoading(true);
    try {
      const user = await userSignUp(form);
      navigate("/finish-registration", { state: { email: user.email } });
    } catch (error) {
      if (error.message?.toLowerCase().includes("username")) setErrors((current) => ({ ...current, username: error.message }));
      else if (error.message?.toLowerCase().includes("email")) setErrors((current) => ({ ...current, email: error.message }));
      else onError(error.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormFieldset name="username" required placeholder="Username" autoComplete="username" maxLength={40} value={form.username} handler={inputHandler} error={errors.username} />
      <FormFieldset name="email" type="email" required placeholder="Email" autoComplete="email" maxLength={254} value={form.email} handler={inputHandler} error={errors.email} />
      <FormFieldset name="password" type="password" required placeholder="Password" autoComplete="new-password" minLength={8} maxLength={30} preventCopy value={form.password} handler={inputHandler} error={errors.password} />
      <FormFieldset name="confirmPassword" type="password" required placeholder="Confirm password" autoComplete="new-password" minLength={8} maxLength={30} preventCopy value={form.confirmPassword} handler={inputHandler} error={errors.confirmPassword} />
      <button className="btn btn-lg btn-primary pull-xs-right" disabled={loading} type="submit">{loading ? "Creating account…" : "Sign up"}</button>
    </form>
  );
}

export default SignUpForm;
