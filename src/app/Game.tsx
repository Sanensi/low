import { useEffect, useRef } from "react";
import { LoW } from "../game/LoW";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<LoW>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error("No HTMLCanvasElement found");
    }
    if (!gameRef.current) {
      gameRef.current = new LoW(canvas);
    }
  }, []);

  return (
    <canvas
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
      ref={canvasRef}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    />
  );
}
