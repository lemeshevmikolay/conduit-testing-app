import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import userLogout from "../../services/userLogout";
import Avatar from "../Avatar";
import DropdownItem from "./DropdownItem";

function DropdownMenu() {
  const [dropdown, setDropdown] = useState(false);
  const toggleRef = useRef(null);
  const { loggedUser, setAuthState } = useAuth();
  const { username, image } = loggedUser || {};

  const logout = () => {
    setAuthState(userLogout);
  };

  const handleClick = () => {
    setDropdown((prev) => !prev);
  };

  return (
    <li className="nav-item dropdown" onKeyDown={(event) => {
      if (event.key === "Escape" && dropdown) {
        setDropdown(false);
        toggleRef.current?.focus();
      }
    }}>
      <button
        aria-expanded={dropdown}
        aria-label={`Account menu for ${username}`}
        className="nav-link dropdown-toggle cursor-pointer"
        onClick={handleClick}
        ref={toggleRef}
        type="button"
      >
        <Avatar alt={username} className="user-pic" src={image} />
        {username}
      </button>

      {dropdown && <div className="dropdown-menu">
        <DropdownItem
          icon="ion-person"
          text="Profile"
          url={`/profile/${username}`}
          state={loggedUser}
        />
        <DropdownItem icon="ion-gear-a" text="Settings" url="/settings" />
        <div className="dropdown-divider"></div>
        <DropdownItem icon="ion-log-out" text="Logout" handler={logout} />
      </div>}
    </li>
  );
}

export default DropdownMenu;
