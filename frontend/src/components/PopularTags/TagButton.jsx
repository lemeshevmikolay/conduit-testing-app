import { useFeedContext } from "../../context/FeedContext";

function TagButton({ tagsList }) {
  const { changeTab } = useFeedContext();

  const handleClick = (e) => {
    changeTab(e, "tag");
  };

  return tagsList.map((name) => (
    <button className="tag-pill tag-default" data-testid="popular-tag" key={name} onClick={handleClick}>
      {name.startsWith("#") ? name : `#${name}`}
    </button>
  ));
}

export default TagButton;
