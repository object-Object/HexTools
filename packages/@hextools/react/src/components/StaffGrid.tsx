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
  panToPattern: (pattern: ResolvedPattern) => void;
  resetPanAndZoom: () => void;
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
  const activePointerEvents = useRef<React.PointerEvent[]>([]).current;
  const prevPointerDistanceRef = useRef(0);

  useImperativeHandle(
    ref,
    () => ({
      panToPattern: (pattern) => {
        guiRef.current?.panToPattern(pattern);
      },
      resetPanAndZoom: () => {
        guiRef.current?.resetPanAndZoom();
      },
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
    activePointerEvents.push(event);
    if (updateMouseRefs(event) && !(event.buttons & MIDDLE_MOUSE_BUTTON)) {
      guiRef.current?.mouseClicked({
        mouseX: mouseXRef.current,
        mouseY: mouseYRef.current,
      });
    } else {
      guiRef.current?.mouseCanceled();
    }
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    // zoom
    const index = activePointerEvents.findIndex(
      ({ pointerId }) => pointerId === event.pointerId,
    );
    if (index > -1) {
      activePointerEvents[index] = event;
    }

    if (activePointerEvents.length === 2) {
      const [event1, event2] = activePointerEvents;
      const currentDistance = Math.hypot(
        event1.clientX - event2.clientX,
        event1.clientY - event2.clientY,
      );
      const prevDistance = prevPointerDistanceRef.current;
      prevPointerDistanceRef.current = currentDistance;

      if (canvasRef.current && prevDistance > 0 && currentDistance > 0) {
        const rect = canvasRef.current.getBoundingClientRect();
        guiRef.current?.mouseZoomed({
          mousePos: {
            mouseX: (event1.clientX + event2.clientX) / 2 - rect.left,
            mouseY: (event1.clientY + event2.clientY) / 2 - rect.top,
          },
          // If current > prev, the distance has increased, so we're zooming in, so grid zoom should decrease
          zoomMultiplier: prevDistance / currentDistance,
        });
      }
    } else {
      prevPointerDistanceRef.current = 0;
    }

    // pan
    if (updateMouseRefs(event)) {
      if (
        activePointerEvents.length === 2
        || event.buttons & MIDDLE_MOUSE_BUTTON
      ) {
        guiRef.current?.mousePanned({
          mouseX: event.movementX,
          mouseY: event.movementY,
        });
      } else if (event.buttons !== 0) {
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

  const removePointerEvent = (event: React.PointerEvent) => {
    // zoom
    prevPointerDistanceRef.current = 0;

    // pan
    for (let i = activePointerEvents.length - 1; i >= 0; i--) {
      if (activePointerEvents[i].pointerId === event.pointerId) {
        activePointerEvents.splice(i, 1);
      }
    }
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    removePointerEvent(event);
    if (updateMouseRefs(event)) {
      guiRef.current?.mouseReleased();
    }
  };

  const handlePointerCancel = (event: React.PointerEvent) => {
    removePointerEvent(event);
    if (updateMouseRefs(event)) {
      guiRef.current?.mouseCanceled();
    }
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (event.deltaY !== 0) {
      guiRef.current?.mouseZoomed({
        mousePos: {
          mouseX: mouseXRef.current,
          mouseY: mouseYRef.current,
        },
        zoomMultiplier: 1 + event.deltaY * 0.001,
      });
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
        onWheel={handleWheel}
        style={{
          width: "100%",
          height: "100%",
          // For two-finger panning to work without conflicting with pinch-to-zoom,
          // we need to disable pinch-to-zoom by setting this to none
          touchAction: "none",
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

const MIDDLE_MOUSE_BUTTON = 4;
