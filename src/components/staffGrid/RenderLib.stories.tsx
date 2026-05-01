import type { Meta, StoryObj } from "@storybook/react-vite";
import { Mat4 } from "gl-matrix";
import { useEffect, useRef } from "react";

import { BufferBuilder } from "../../render/buffer";
import {
  loadPositionColorShader,
  enablePositionColorShader,
} from "../../render/shaders";
import { drawLineSeq, drawSpot } from "../../render/staffGrid/renderLib";

function RenderLibStory() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) {
      throw new Error("Ref not loaded");
    }

    const gl = ref.current.getContext("webgl2");
    if (!gl) {
      throw new Error("WebGL2 not supported :(");
    }

    gl.clearColor(1, 1, 1, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    const shader = loadPositionColorShader(gl);
    enablePositionColorShader({ gl, shader, width: 640, height: 480 });

    const buf = new BufferBuilder(gl);

    drawSpot({
      buf,
      mat: new Mat4(),
      point: [320, 240],
      radius: 64,
      r: 0,
      g: 0,
      b: 1,
      a: 1,
    });

    drawLineSeq({
      buf,
      mat: new Mat4(),
      points: [
        [50, 50],
        [100, 100],
        [50, 100],
        [150, 200],
      ],
      width: 8,
      z: 1,
      tail: [0, 1, 0, 1],
      head: [0, 0, 1, 1],
      isCtrlDown: true,
    });
  }, []);

  return <canvas ref={ref} width="640" height="480" />;
}

const meta = {
  component: RenderLibStory,
} satisfies Meta<typeof RenderLibStory>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
