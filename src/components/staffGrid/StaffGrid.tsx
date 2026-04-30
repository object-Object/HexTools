import { useEffect, useRef, type PointerEventHandler } from "react";

import { GuiSpellcasting } from "../../render/staffGrid/guiSpellcasting";

export default function StaffGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guiRef = useRef<GuiSpellcasting>(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) {
      throw new Error("Ref not loaded");
    }

    const gui = new GuiSpellcasting(canvasRef.current);
    guiRef.current = gui;

    const handleAnimationFrame = (timestamp: DOMHighResTimeStamp) => {
      if (canvasRef.current) {
        gui.render({
          mouseX: mouseXRef.current,
          mouseY: mouseYRef.current,
          timestamp,
        });
      }
      id = requestAnimationFrame(handleAnimationFrame);
    };
    let id = requestAnimationFrame(handleAnimationFrame);

    return () => cancelAnimationFrame(id);
  }, []);

  const handlePointerDown: PointerEventHandler = () => {
    guiRef.current?.mouseClicked({
      mouseX: mouseXRef.current,
      mouseY: mouseYRef.current,
    });
  };

  const handlePointerMove: PointerEventHandler = (event) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseXRef.current = event.clientX - rect.left;
    mouseYRef.current = event.clientY - rect.top;
    if (event.buttons !== 0) {
      guiRef.current?.mouseDragged({
        mouseX: mouseXRef.current,
        mouseY: mouseYRef.current,
      });
    }
  };

  const handlePointerUp: PointerEventHandler = () => {
    guiRef.current?.mouseReleased();
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      width="1024"
      height="768"
    />
  );
}
