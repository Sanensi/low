const checkboard = Array.from({ length: 8 }, (_, y) =>
  Array.from(
    { length: 8 },
    (_, x) =>
      ({
        x,
        y,
        color: (x + y) % 2 === 0 ? "black" : "white",
      }) as const,
  ),
).flat();

export function Grid() {
  return (
    <div>
      {checkboard.map(({ x, y, color }) => (
        <span
          key={`(${x},${y})`}
          style={{
            backgroundColor: color,
            color: "gray",
            position: "absolute",
            width: "50px",
            height: "50px",
            transform: `translate(${x * 50}px, ${y * 50}px)`,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => console.log(`(${x}, ${y})`)}
        >
          ({x}, {y})
        </span>
      ))}
    </div>
  );
}
