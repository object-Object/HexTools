import React, {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
} from "react";

import {
  GuiSpellcasting,
  type GuiSpellcastingSettings,
  type NamedResolvedPatternType,
  type ResolvedPattern,
  type ResolvedPatternType,
} from "@hextools/renderer/staffGrid";

export interface StaffGridProps {
  patterns: readonly ResolvedPattern[];
  onPatternsChange: (patterns: readonly ResolvedPattern[]) => unknown;
  patternType: ResolvedPatternType;
  onPatternTypeChange: (type: NamedResolvedPatternType) => unknown;
  settings: GuiSpellcastingSettings;
  ref?: React.Ref<StaffGridRef>;
}

export interface StaffGridRef {
  cancelPattern: () => void;
  setZappyMultiplier: (value: number) => void;
}

export function StaffGrid({
  patterns,
  onPatternsChange,
  patternType,
  onPatternTypeChange,
  settings,
  ref,
}: StaffGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guiRef = useRef<GuiSpellcasting>(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const isCtrlDownRef = useRef(false);
  const zappyMultiplierRef = useRef(1);

  useImperativeHandle(
    ref,
    () => ({
      cancelPattern: () => {
        guiRef.current?.mouseCanceled();
      },
      setZappyMultiplier: (value) => {
        zappyMultiplierRef.current = value;
      },
    }),
    [],
  );

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
      onPatternsChange,
      patternType,
      onPatternTypeChange,
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

  useEffect(() => {
    if (guiRef.current) {
      guiRef.current.settings = settings;
      guiRef.current.onPatternsChange = onPatternsChange;
      guiRef.current.patternType = patternType;
      guiRef.current.onPatternTypeChange = onPatternTypeChange;
    }
  }, [settings, onPatternsChange, patternType, onPatternTypeChange]);

  useEffect(() => {
    guiRef.current?.setPatterns(patterns, false);
  }, [patterns]);

  return (
    <div
      style={{
        position: "absolute",
        inset: "0",
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
        style={{
          width: "100%",
          height: "100%",
          touchAction: "pinch-zoom",
        }}
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
