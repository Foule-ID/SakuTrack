// Skeleton placeholder shown while data loads. rows: list-style placeholder instead of cards.
export default function Loading({ rows }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {rows
        ? [0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 52, marginBottom: 10 }} />)
        : <>
            <div className="grid3">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 112 }} />)}</div>
            <div className="skeleton" style={{ height: 260, marginTop: 16 }} />
          </>}
    </div>
  );
}
