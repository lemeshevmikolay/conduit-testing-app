import { Link, NavLink } from "react-router-dom";
import { Braces, Code2, Compass, PenLine, UserRoundPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import DropdownMenu from "./DropdownMenu";

function Navbar() {
  const { isAuth } = useAuth();

  return (
    <nav className="app-navbar" aria-label="Main navigation">
      <div className="navbar-inner">
        <Link className="brand-mark" to="/" aria-label="Conduit home">
          <span className="brand-icon"><Braces size={21} strokeWidth={2.5} /></span>
          <span>conduit</span>
        </Link>

        <div className="navbar-links">
          <NavLink className={({ isActive }) => `nav-action ${isActive ? "is-active" : ""}`} end to="/">
            <Compass size={18} /> <span>Home</span>
          </NavLink>
          {isAuth ? (
            <>
              <NavLink className="nav-action create-action" to="/editor"><PenLine size={17} /><span>Write</span></NavLink>
              <DropdownMenu />
            </>
          ) : (
            <>
              <NavLink className="nav-action" to="/login">Sign in</NavLink>
              <NavLink className="nav-join" to="/register"><UserRoundPlus size={16} /> Join Conduit</NavLink>
            </>
          )}
          <a className="github-action" href="https://github.com/TonyMckes/conduit-realworld-example-app" aria-label="View source on GitHub"><Code2 size={18} /></a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
