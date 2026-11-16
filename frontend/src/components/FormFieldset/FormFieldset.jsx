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
  const labelId = `${name}-label`;
  return (
    <div className="form-group">
      <label className="visually-hidden" htmlFor={name} id={labelId}>{placeholder}</label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? "true" : undefined}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={`form-control ${normal ? "" : "form-control-lg"}`}
        id={name}
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
    </div>
  );
}

export default FormFieldset;
