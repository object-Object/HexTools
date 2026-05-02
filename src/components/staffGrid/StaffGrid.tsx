import { Box } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { useEffect, useRef, type PointerEventHandler } from "react";

import { useOnMount } from "../../hooks/useOnMount";
import {
  GuiSpellcasting,
  type GuiSpellcastingSettings,
} from "../../render/staffGrid/guiSpellcasting";
import StaffGridSettings from "./StaffGridSettings";

export default function StaffGrid() {
  const [settings, setSettingsInternal] =
    useLocalStorage<GuiSpellcastingSettings>({
      key: "staff-grid-settings",
      defaultValue: {
        guiScale: 2,
        gridZoom: 1,
        zappyVariance: 2.5,
      },
    });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guiRef = useRef<GuiSpellcasting>(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const isCtrlDownRef = useRef(false);

  const setSettings = (newSettings: GuiSpellcastingSettings) => {
    setSettingsInternal(newSettings);
    if (guiRef.current) {
      guiRef.current.settings = newSettings;
    }
  };

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
    if (event.key === "Escape") {
      guiRef.current?.escapePressed();
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    isCtrlDownRef.current = event.ctrlKey;
  };

  useOnMount(() => {
    if (!canvasRef.current) {
      throw new Error("Ref not loaded");
    }

    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      throw new Error("WebGL2 not supported :(");
    }

    const gui = new GuiSpellcasting(gl, settings);
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
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <>
      <Box pos="absolute" inset="0" style={{ overflow: "hidden" }}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ width: "100%", height: "100%", touchAction: "none" }}
        />
      </Box>
      <Box pos="absolute" top={16} right={16}>
        <StaffGridSettings settings={settings} onSettingsChange={setSettings} />
      </Box>
    </>
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
