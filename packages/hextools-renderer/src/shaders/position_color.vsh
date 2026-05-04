#version 300 es

in vec3 Position;
in vec4 Color;

uniform mat4 ModelViewMat;
uniform mat4 ProjMat;

out vec4 vertexColor;

// Keep in sync with FIXED_POINT in buffer.ts
const float FIXED_POINT = 1024.0;

void main() {
    gl_Position = ProjMat * ModelViewMat * vec4(Position / FIXED_POINT, 1.0);

    vertexColor = Color;
}
