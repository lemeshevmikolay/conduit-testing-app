function FormFieldset({
  autoFocus,
  children,
  error,
  handler,
  maxLength,
  minLength,
  name,
  normal,
  placeholder,
  required,
  type,
  value,
  preventCopy,
  autoComplete,
}) {
  const errorId = `${name}-error`;
  return (
    <fieldset className="form-group">
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? "true" : undefined}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={`form-control ${normal ? "" : "form-control-lg"}`}
        maxLength={maxLength}
        minLength={minLength}
        name={name}
        onChange={handler}
        onCopy={preventCopy ? (event) => event.preventDefault() : undefined}
        onCut={preventCopy ? (event) => event.preventDefault() : undefined}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
      {children}
      {error && <small className="error-messages" id={errorId} role="alert">{error}</small>}
    </fieldset>
  );
}

export default FormFieldset;
