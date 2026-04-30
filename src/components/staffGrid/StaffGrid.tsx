import { useEffect, useRef, type PointerEventHandler } from "react";

import { GuiSpellcasting } from "../../render/staffGrid/guiSpellcasting";

export default function StaffGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) {
      throw new Error("Ref not loaded");
    }

    const gui = new GuiSpellcasting(canvasRef.current);

    const handleAnimationFrame = (timestamp: DOMHighResTimeStamp) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        gui.render({
          mouseX: mouseXRef.current - rect.left,
          mouseY: mouseYRef.current - rect.top,
          timestamp,
        });
      }
      id = requestAnimationFrame(handleAnimationFrame);
    };
    let id = requestAnimationFrame(handleAnimationFrame);

    return () => cancelAnimationFrame(id);
  }, []);

  const handlePointerMove: PointerEventHandler = (event) => {
    mouseXRef.current = event.clientX;
    mouseYRef.current = event.clientY;
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerMove={handlePointerMove}
      width="1024"
      height="768"
    />
  );
}
