export default function ElementGroup({ categories }) {
  return (
    <div className="legend">
      {Object.entries(categories).map(([cat, color]) => (
        <div key={cat} className="legend-item">
          <div className={`legend-swatch ${color}`} />
          <span>{cat}</span>
        </div>
      ))}
    </div>
  );
}
