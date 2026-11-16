import { Link } from "react-router-dom";

function DropdownItem({ handler, icon, text, url, state }) {
  return (
    <Link
      className="dropdown-item"
      onClick={handler}
      to={url || "#"}
      state={state}
    >
      {icon && <i aria-hidden="true" className={icon}></i>} {text}
    </Link>
  );
}
export default DropdownItem;
