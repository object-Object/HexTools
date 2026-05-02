import { useEffect, useRef, type PointerEventHandler } from "react";

import { useOnMount } from "../../hooks/useOnMount";
import { GuiSpellcasting } from "../../render/staffGrid/guiSpellcasting";

export default function StaffGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guiRef = useRef<GuiSpellcasting>(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const isCtrlDownRef = useRef(false);
  const guiScale = 2; // TODO

  useOnMount(() => {
    if (!canvasRef.current) {
      throw new Error("Ref not loaded");
    }

    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      throw new Error("WebGL2 not supported :(");
    }

    const gui = new GuiSpellcasting({ gl, guiScale });
    guiRef.current = gui;

    let isMounted = true;
    const handleAnimationFrame = (timestamp: DOMHighResTimeStamp) => {
      if (!isMounted || !canvas.isConnected) return;
      maybeResizeCanvas(canvas, gl);
      gui.render({
        mouseX: mouseXRef.current,
        mouseY: mouseYRef.current,
        isCtrlDown: isCtrlDownRef.current,
        timestamp,
      });
      requestAnimationFrame(handleAnimationFrame);
    };
    requestAnimationFrame(handleAnimationFrame);

    return () => {
      isMounted = false;
    };
  });

  useEffect(() => {
    if (guiRef.current) {
      guiRef.current.guiScale = guiScale;
    }
  }, [guiScale]);

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

  const handleKeyDown = (event: KeyboardEvent) => {
    isCtrlDownRef.current = event.ctrlKey;
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    isCtrlDownRef.current = event.ctrlKey;
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        overflow: "hidden",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      />
    </div>
  );
}

// https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
function maybeResizeCanvas(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
) {
  const { clientWidth, clientHeight, width, height } = canvas;
  if (width !== clientWidth || height !== clientHeight) {
    canvas.width = clientWidth;
    canvas.height = clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
}
