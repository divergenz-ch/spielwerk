import type { Frame, Renderer } from '../engine/contracts';

export type LiquidScene = {
  kind: 'liquid-gradients';
  scale: number;
  distortion: number;
  softness: number;
  grain: number;
  imageMix: number;
  imageFit: 'cover' | 'contain';
  /** Browser-decoded asset, not a source of geometry, random draws, or time. */
  image?: HTMLCanvasElement;
  offset: [number, number];
  orbit: [number, number];
  colors: [number[], number[], number[], number[]];
};

const vertex = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 u_resolution, u_offset, u_orbit;
uniform float u_scale, u_distortion, u_softness, u_grain;
uniform vec3 u_c1, u_c2, u_c3, u_c4;
uniform sampler2D u_image;
uniform vec2 u_imageResolution;
uniform float u_imageMix;
uniform bool u_contain;
out vec4 outColor;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1)), f.x), f.y);
}
float field(vec2 p) {
  float value = 0.0, weight = 0.57;
  for (int i = 0; i < 4; i++) {
    value += weight * noise(p);
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + 13.4;
    weight *= 0.45;
  }
  return value;
}
void main() {
  // Relative artboard coordinates: resize changes the field, never stretches pixels.
  vec2 uv = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y) / u_resolution;
  vec2 p = (uv - 0.5) * u_resolution / min(u_resolution.x, u_resolution.y);
  p = p * u_scale * 2.4 + u_offset;
  vec2 orbit = u_orbit * 0.65;
  vec2 warp = vec2(field(p + orbit), field(p + vec2(7.3, 3.8) - orbit));
  vec2 q = p + (warp - 0.5) * u_distortion * 4.0;
  float flow = 0.5 + 0.5 * sin(q.x * 1.8 + q.y * 0.9 + field(q + orbit) * 4.0);
  float crossflow = field(q * 0.7 + vec2(12.7, 8.2) + orbit);
  float edge = mix(0.025, 0.4, u_softness);
  float a = smoothstep(0.45 - edge, 0.45 + edge, flow);
  float b = smoothstep(0.53 - edge * 0.7, 0.53 + edge * 0.7, crossflow);
  // Blend in linear light, then return to display sRGB.
  vec3 warm = mix(pow(u_c1, vec3(2.2)), pow(u_c2, vec3(2.2)), a);
  vec3 light = mix(pow(u_c3, vec3(2.2)), pow(u_c4, vec3(2.2)), a);
  vec3 color = pow(mix(warm, light, b), vec3(1.0 / 2.2));
  if (u_imageMix > 0.0) {
    float artAspect = u_resolution.x / u_resolution.y;
    float imageAspect = u_imageResolution.x / u_imageResolution.y;
    vec2 fit = vec2(1.0);
    if (u_contain) {
      if (imageAspect > artAspect) fit.y = imageAspect / artAspect;
      else fit.x = artAspect / imageAspect;
    } else {
      if (imageAspect > artAspect) fit.x = artAspect / imageAspect;
      else fit.y = imageAspect / artAspect;
    }
    // Zero distortion preserves the original image. Use the same seeded,
    // periodic flow as the gradient; transparent pixels reveal the palette.
    vec2 imageUv = (uv - 0.5 + (warp - 0.5) * u_distortion * 0.3) * fit + 0.5;
    vec4 texel = texture(u_image, imageUv);
    float inside = u_contain ? step(0.0, imageUv.x) * step(imageUv.x, 1.0)
      * step(0.0, imageUv.y) * step(imageUv.y, 1.0) : 1.0;
    color = mix(color, texel.rgb, u_imageMix * texel.a * inside);
  }
  // Stationary grain avoids temporal flicker and preserves the exact loop seam.
  color += (hash(gl_FragCoord.xy + u_offset) - 0.5) * u_grain;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

/** One context/program per target; no private animation clock. */
class LiquidSurface {
  readonly canvas = document.createElement('canvas');
  private gl: WebGL2RenderingContext;
  private program?: WebGLProgram;
  private texture?: WebGLTexture;
  private image?: HTMLCanvasElement;
  private maxViewport!: Int32Array;
  private maxTextureSize = 0;
  private uniforms = new Map<string, WebGLUniformLocation>();
  private last?: Frame<LiquidScene>;
  private disposed = false;
  private restoreError?: unknown;

  constructor(target: HTMLElement) {
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Liquid gradient artwork');
    this.canvas.style.cssText = 'display:block;width:100%;height:100%';
    const gl = this.canvas.getContext('webgl2', {
      alpha: false, antialias: false, depth: false, stencil: false,
      // Retain the selected instant for capture while paused.
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error('Liquid Gradients requires WebGL2. Enable hardware acceleration or try a supported browser.');
    this.gl = gl;
    this.canvas.addEventListener('webglcontextlost', this.lost);
    this.canvas.addEventListener('webglcontextrestored', this.restored);
    try { this.initialize(); target.replaceChildren(this.canvas); }
    catch (error) { this.dispose(); throw error; }
  }
  private lost = (event: Event) => {
    event.preventDefault();
    this.program = undefined;
    this.texture = undefined;
    this.image = undefined;
    this.uniforms.clear();
  };
  private restored = () => {
    if (this.disposed) return;
    try {
      this.restoreError = undefined;
      this.initialize();
      if (this.last) this.render(this.last);
    } catch (error) { this.restoreError = error; }
  };
  private initialize() {
    const gl = this.gl;
    this.maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const shaders: WebGLShader[] = [];
    const program = gl.createProgram();
    if (!program) throw new Error('Unable to allocate a shader program.');
    try {
      for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Unable to allocate a shader.');
        shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(`Liquid shader compilation failed: ${gl.getShaderInfoLog(shader)}`);
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Liquid shader linking failed: ${gl.getProgramInfoLog(program)}`);
      this.program = program;
      for (const key of ['resolution', 'offset', 'orbit', 'scale', 'distortion', 'softness', 'grain', 'c1', 'c2', 'c3', 'c4', 'image', 'imageResolution', 'imageMix', 'contain']) {
        const location = gl.getUniformLocation(program, `u_${key}`);
        if (location === null) throw new Error(`Missing liquid shader uniform: ${key}`);
        this.uniforms.set(key, location);
      }
    } catch (error) { gl.deleteProgram(program); this.program = undefined; throw error; }
    finally {
      for (const shader of shaders) {
        if (this.program === program) gl.detachShader(program, shader);
        gl.deleteShader(shader);
      }
    }
  }
  private updateTexture(image?: HTMLCanvasElement) {
    if (this.texture && this.image === image) return;
    const gl = this.gl;
    if (image && (image.width > this.maxTextureSize || image.height > this.maxTextureSize)) {
      throw new Error('This image exceeds the GPU texture limit. Choose a smaller image.');
    }
    const texture = gl.createTexture();
    if (!texture) throw new Error('Unable to allocate an image texture.');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    try {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      if (image) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
      if (gl.getError() !== gl.NO_ERROR) throw new Error('Unable to upload the image to the GPU. Choose a smaller image.');
    } catch (error) {
      gl.deleteTexture(texture);
      gl.bindTexture(gl.TEXTURE_2D, this.texture ?? null);
      throw error;
    }
    if (this.texture) gl.deleteTexture(this.texture);
    this.texture = texture;
    this.image = image;
  }
  render(frame: Frame<LiquidScene>) {
    if (this.disposed) throw new Error('Liquid renderer has been disposed.');
    if (this.restoreError) throw this.restoreError;
    this.last = frame;
    const gl = this.gl;
    if (gl.isContextLost() || !this.program) throw new Error('Graphics context lost. Waiting for WebGL2 to recover.');
    this.updateTexture(frame.scene.image);
    this.canvas.setAttribute('aria-label', frame.scene.image ? 'Liquid image artwork' : 'Liquid gradient artwork');
    const { width, height } = frame.dimensions;
    if (width > this.maxViewport[0] || height > this.maxViewport[1]) throw new Error('This artboard exceeds the GPU viewport limit. Choose a smaller size.');
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    if (gl.drawingBufferWidth !== width || gl.drawingBufferHeight !== height) throw new Error('Unable to allocate the full-size GPU artboard. Choose a smaller size.');
    gl.viewport(0, 0, width, height); gl.useProgram(this.program);
    const u = (key: string) => this.uniforms.get(key)!;
    gl.uniform2f(u('resolution'), width, height);
    gl.uniform2fv(u('offset'), frame.scene.offset); gl.uniform2fv(u('orbit'), frame.scene.orbit);
    for (const key of ['scale', 'distortion', 'softness', 'grain'] as const) gl.uniform1f(u(key), frame.scene[key]);
    frame.scene.colors.forEach((color, i) => gl.uniform3fv(u(`c${i + 1}`), color));
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texture!);
    gl.uniform1i(u('image'), 0);
    gl.uniform2f(u('imageResolution'), this.image?.width ?? 1, this.image?.height ?? 1);
    gl.uniform1f(u('imageMix'), this.image ? frame.scene.imageMix : 0);
    gl.uniform1i(u('contain'), frame.scene.imageFit === 'contain' ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.removeEventListener('webglcontextlost', this.lost);
    this.canvas.removeEventListener('webglcontextrestored', this.restored);
    if (this.program) this.gl.deleteProgram(this.program);
    if (this.texture) this.gl.deleteTexture(this.texture);
    this.texture = undefined; this.image = undefined;
    this.uniforms.clear(); this.last = undefined;
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.canvas.remove();
  }
}

const surfaces = new WeakMap<HTMLElement, LiquidSurface>();
export const liquidRenderer: Renderer<LiquidScene, HTMLElement> = {
  persistent: true,
  render(frame, target) {
    let surface = surfaces.get(target);
    if (!surface) { surface = new LiquidSurface(target); surfaces.set(target, surface); }
    surface.render(frame);
  },
  dispose(target) { surfaces.get(target)?.dispose(); surfaces.delete(target); },
};
