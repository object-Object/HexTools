import { Box } from "@mantine/core";
import { useHotkeys, useStateHistory } from "@mantine/hooks";
import _ from "lodash";
import React, { useEffect, useEffectEvent, useRef } from "react";

import { useDeviceMotion } from "@hextools/react";
import { useIsTouchscreen } from "@hextools/react";
import { useLocalStorageObject } from "@hextools/react";
import {
  GuiSpellcasting,
  type GuiSpellcastingSettings,
  type ResolvedPattern,
} from "@hextools/renderer/staffGrid";

import StaffGridControls from "./StaffGridControls";

export default function StaffGrid() {
  const isTouchscreen = useIsTouchscreen();

  const [patterns, patternsHandlers, patternsHistory] = useStateHistory<
    ResolvedPattern[]
  >([]);

  const defaultSettings = GuiSpellcasting.getDefaultSettings({
    isTouchscreen,
  });

  const [settings, setSettings] =
    useLocalStorageObject<GuiSpellcastingSettings>({
      key: "staff-grid-settings",
      defaultValue: defaultSettings,
    });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guiRef = useRef<GuiSpellcasting>(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const isCtrlDownRef = useRef(false);
  const zappyMultiplierRef = useRef(1);

  useHotkeys([
    ["Escape", () => guiRef.current?.mouseCanceled()],
    ["mod+Z", () => patternsHandlers.back()],
    ["mod+Y", () => patternsHandlers.forward()],
    ["mod+shift+Z", () => patternsHandlers.forward()],
  ]);

  useDeviceMotion({
    shakeDuration: 1500,
    shakeThreshold: 15,
    onMeanAcceleration: (meanAcceleration) => {
      zappyMultiplierRef.current = settings.zappyOnShake
        ? _.clamp(meanAcceleration / 5, 1, 3)
        : 1;
    },
    onShake: () => {
      switch (settings.shakeAction) {
        case "none":
          break;
        case "undo":
          patternsHandlers.back();
          break;
        case "clear":
          patternsHandlers.set([]);
          break;
      }
    },
  });

  const updateMouseRefs = (event: React.PointerEvent) => {
    if (!canvasRef.current || !event.isPrimary) return false;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseXRef.current = event.clientX - rect.left;
    mouseYRef.current = event.clientY - rect.top;
    return true;
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (updateMouseRefs(event)) {
      guiRef.current?.mouseClicked({
        mouseX: mouseXRef.current,
        mouseY: mouseYRef.current,
      });
    } else {
      guiRef.current?.mouseCanceled();
    }
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (updateMouseRefs(event)) {
      if (event.buttons !== 0) {
        guiRef.current?.mouseDragged({
          mouseX: mouseXRef.current,
          mouseY: mouseYRef.current,
        });
      } else {
        guiRef.current?.mouseMoved({
          mouseX: mouseXRef.current,
          mouseY: mouseYRef.current,
        });
      }
    }
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (updateMouseRefs(event)) {
      guiRef.current?.mouseReleased();
    }
  };

  const handlePointerCancel = (event: React.PointerEvent) => {
    if (updateMouseRefs(event)) {
      guiRef.current?.mouseCanceled();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    isCtrlDownRef.current = event.ctrlKey;
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    isCtrlDownRef.current = event.ctrlKey;
  };

  const setupGui = useEffectEvent(() => {
    if (!canvasRef.current) {
      throw new Error("Ref not loaded");
    }

    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      throw new Error("WebGL2 not supported :(");
    }

    const gui = new GuiSpellcasting({
      gl,
      settings,
      patterns,
      onPatternsChange: patternsHandlers.set,
    });
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
        zappyMultiplier: zappyMultiplierRef.current,
      });
      requestAnimationFrame(handleAnimationFrame);
    };
    requestAnimationFrame(handleAnimationFrame);

    return () => {
      isMounted = false;
    };
  });

  useEffect(() => {
    setupGui();
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // settings isn't loaded from the session store when useOnMount runs
  // so we need to update it in a useEffect instead of just the setter
  useEffect(() => {
    if (guiRef.current) {
      guiRef.current.settings = settings;
    }
  }, [settings]);

  useEffect(() => {
    guiRef.current?.setPatterns(patterns, false);
  }, [patterns]);

  return (
    <>
      <Box
        pos="absolute"
        inset="0"
        style={{
          overflow: "hidden",
          // Prevent iOS select on press and hold
          // https://stackoverflow.com/a/78378759
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{ width: "100%", height: "100%", touchAction: "pinch-zoom" }}
        />
      </Box>

      <StaffGridControls
        patterns={patterns}
        patternsHandlers={patternsHandlers}
        patternsHistory={patternsHistory}
        settings={settings}
        onSettingsChange={setSettings}
        onResetSettings={() => setSettings(defaultSettings)}
      />
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
