function ArticleTags({ tagList }) {
  return (
    tagList?.length > 0 && (
      <ul className="tag-list">
        {tagList.map((tag) => (
          <li data-testid="article-tag" key={tag} className="tag-default tag-pill tag-outline">
            {tag.startsWith("#") ? tag : `#${tag}`}
          </li>
        ))}
      </ul>
    )
  );
}

export default ArticleTags;
