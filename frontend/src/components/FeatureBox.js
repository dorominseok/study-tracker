function FeatureBox({ title, description, onClick }) {
  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <div className="feature-box" onClick={onClick} onKeyDown={handleKeyDown} role="button" tabIndex={0}>
      <strong className="feature-title">{title}</strong>
      <div className="feature-description">{description}</div>
    </div>
  );
}

export default FeatureBox;
