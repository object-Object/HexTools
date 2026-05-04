import ByteBuffer from "bytebuffer";
import { Vec4, type Mat4Like } from "gl-matrix";

export class BufferBuilder {
  gl: WebGL2RenderingContext;
  buffer: ByteBuffer;
  mode: GLenum = 0;
  vertices = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.buffer = new ByteBuffer(
      ByteBuffer.DEFAULT_CAPACITY,
      ByteBuffer.LITTLE_ENDIAN,
    );
  }

  begin(mode: GLenum): this {
    this.buffer.clear();
    this.vertices = 0;
    this.mode = mode;
    return this;
  }

  end(): this {
    const gl = this.gl;
    this.buffer.flip();
    gl.bufferData(gl.ARRAY_BUFFER, this.buffer.toArrayBuffer(), gl.STREAM_DRAW);
    gl.drawArrays(this.mode, 0, this.vertices);
    return this;
  }

  vertex(mat: Mat4Like | null, x: number, y: number, z: number): this {
    if (mat != null) {
      const vec = new Vec4(x, y, z, 1);
      Vec4.transformMat4(vec, vec, mat);
      this.buffer.writeInt32(Math.floor(vec.x * FIXED_POINT));
      this.buffer.writeInt32(Math.floor(vec.y * FIXED_POINT));
      this.buffer.writeInt32(Math.floor(vec.z * FIXED_POINT));
    } else {
      this.buffer.writeInt32(Math.floor(x * FIXED_POINT));
      this.buffer.writeInt32(Math.floor(y * FIXED_POINT));
      this.buffer.writeInt32(Math.floor(z * FIXED_POINT));
    }
    this.vertices++;
    return this;
  }

  color(r: number, g: number, b: number, a: number): this {
    this.buffer.writeUint8(Math.floor(r * 255));
    this.buffer.writeUint8(Math.floor(g * 255));
    this.buffer.writeUint8(Math.floor(b * 255));
    this.buffer.writeUint8(Math.floor(a * 255));
    return this;
  }
}

// Keep in sync with FIXED_POINT in position_color.vsh
const FIXED_POINT = 1024;
