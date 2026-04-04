function FeatureBox({ title, description, onClick }) {
  function handleKeyDown(event) {
    // 마우스 클릭뿐 아니라 Enter, Space 키로도 같은 동작을 수행하도록 맞춘다.
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
