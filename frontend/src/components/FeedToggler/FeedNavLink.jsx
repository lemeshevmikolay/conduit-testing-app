import { useFeedContext } from "../../context/FeedContext";

function FeedNavLink({ icon, name, text }) {
  const { tabName, changeTab } = useFeedContext();

  const handleClick = (e) => {
    changeTab(e, name);
  };

  return (
    <li className="nav-item">
      <button
        className={`nav-link ${tabName === name ? "active" : ""}`}
        data-testid={`feed-tab-${name}`}
        onClick={handleClick}
      >
        {icon && <i className="ion-pound"></i>} {text}
      </button>
    </li>
  );
}

export default FeedNavLink;
