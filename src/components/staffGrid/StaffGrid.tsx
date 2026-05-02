import { ActionIcon, Box, Stack } from "@mantine/core";
import { useHotkeys, useStateHistory } from "@mantine/hooks";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconTrash,
} from "@tabler/icons-react";
import React, { useEffect, useRef } from "react";

import { useIsTouchscreen } from "../../hooks/useIsTouchscreen";
import { useLocalStorageObject } from "../../hooks/useLocalStorageObject";
import { useOnMount } from "../../hooks/useOnMount";
import {
  GuiSpellcasting,
  type GuiSpellcastingSettings,
  type ResolvedPattern,
} from "../../render/staffGrid/guiSpellcasting";
import { staffGridButtonProps } from "./StaffGrid.lib";
import StaffGridSettings from "./StaffGridSettings";

export default function StaffGrid() {
  const isTouchscreen = useIsTouchscreen();

  const [patterns, patternsHandlers, patternsHistory] = useStateHistory<
    ResolvedPattern[]
  >([]);

  const [settings, setSettings] =
    useLocalStorageObject<GuiSpellcastingSettings>({
      key: "staff-grid-settings",
      defaultValue: GuiSpellcasting.getDefaultSettings({
        isTouchscreen,
      }),
    });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guiRef = useRef<GuiSpellcasting>(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const isCtrlDownRef = useRef(false);

  useHotkeys([
    ["Escape", () => guiRef.current?.mouseCanceled()],
    ["mod+Z", () => patternsHandlers.back()],
    ["mod+Y", () => patternsHandlers.forward()],
  ]);

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
      // guiRef.current?.mouseCanceled();
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

  useOnMount(() => {
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
      <Box pos="absolute" inset="0" style={{ overflow: "hidden" }}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{ width: "100%", height: "100%", touchAction: "pinch-zoom" }}
        />
      </Box>

      <Stack gap="xs" pos="absolute" top={16} right={16}>
        <StaffGridSettings settings={settings} onSettingsChange={setSettings} />

        <ActionIcon
          {...staffGridButtonProps}
          onClick={() => patternsHandlers.back()}
          disabled={patternsHistory.current === 0}
        >
          <IconArrowBackUp />
        </ActionIcon>

        <ActionIcon
          {...staffGridButtonProps}
          onClick={() => patternsHandlers.forward()}
          disabled={
            patternsHistory.current === patternsHistory.history.length - 1
          }
        >
          <IconArrowForwardUp />
        </ActionIcon>

        <ActionIcon
          {...staffGridButtonProps}
          onClick={() => patternsHandlers.set([])}
          disabled={patterns.length === 0}
        >
          <IconTrash />
        </ActionIcon>
      </Stack>
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
