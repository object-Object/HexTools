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
      this.buffer.writeFloat32(vec.x);
      this.buffer.writeFloat32(vec.y);
      this.buffer.writeFloat32(vec.z);
    } else {
      this.buffer.writeFloat32(x);
      this.buffer.writeFloat32(y);
      this.buffer.writeFloat32(z);
    }
    this.vertices++;
    return this;
  }

  color(r: number, g: number, b: number, a: number): this {
    for (const value of [r, g, b, a]) {
      this.buffer.writeUint8(Math.floor(value * 255));
    }
    return this;
  }
}
