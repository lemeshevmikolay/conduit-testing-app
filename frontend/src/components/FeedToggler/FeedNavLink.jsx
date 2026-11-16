import { useFeedContext } from "../../context/FeedContext";

function FeedNavLink({ icon, name, text }) {
  const { tabName, changeTab } = useFeedContext();

  const handleClick = (e) => {
    changeTab(e, name);
  };

  return (
    <li className="nav-item">
      <button
        aria-pressed={tabName === name}
        className={`nav-link ${tabName === name ? "active" : ""}`}
        data-testid={`feed-tab-${name}`}
        onClick={handleClick}
        type="button"
      >
        {icon && <i aria-hidden="true" className="ion-pound"></i>} {text}
      </button>
    </li>
  );
}

export default FeedNavLink;
