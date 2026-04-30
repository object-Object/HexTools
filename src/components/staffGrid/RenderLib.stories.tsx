import type { Meta, StoryObj } from "@storybook/react-vite";
import { Mat4, Vec2 } from "gl-matrix";
import { useEffect, useRef } from "react";

import { BufferBuilder } from "../../render/buffer";
import {
  loadPositionColorShader,
  enablePositionColorShader,
} from "../../render/shaders";
import { drawSpot } from "../../render/staffGrid/renderLib";

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

    const program = loadPositionColorShader(gl);
    enablePositionColorShader({ gl, program, width: 640, height: 480 });

    const buf = new BufferBuilder(gl);
    drawSpot({
      buf,
      mat: new Mat4(),
      point: new Vec2(320, 240),
      radius: 64,
      r: 0,
      g: 0,
      b: 1,
      a: 1,
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
