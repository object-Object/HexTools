import ByteBuffer from "bytebuffer";
import { vec4, mat4 } from "gl-matrix";

export class BufferBuilder {
  buffer: ByteBuffer;
  vertices = 0;

  constructor() {
    this.buffer = new ByteBuffer(
      ByteBuffer.DEFAULT_CAPACITY,
      ByteBuffer.LITTLE_ENDIAN,
    );
  }

  start(): this {
    this.buffer.clear();
    this.vertices = 0;
    return this;
  }

  end(): this {
    this.buffer.flip();
    return this;
  }

  vertex(mat: mat4, x: number, y: number, z: number): this {
    const vec = vec4.fromValues(x, y, z, 1);
    vec4.transformMat4(vec, vec, mat);
    this.buffer.writeFloat32(vec[0]);
    this.buffer.writeFloat32(vec[1]);
    this.buffer.writeFloat32(vec[2]);
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
