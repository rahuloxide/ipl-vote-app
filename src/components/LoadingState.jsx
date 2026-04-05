function LoadingState({ message }) {
  return (
    <section className="loading-card">
      <div className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </section>
  );
}

export default LoadingState;
