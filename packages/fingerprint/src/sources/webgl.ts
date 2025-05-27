import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

const WEBGL_KEY = 'webgl';

export class WebGLSource implements Source {
  public readonly key = WEBGL_KEY;

  /**
   * Attempts to obtain a WebGL context from the canvas.
   * @param canvas The canvas element.
   * @returns The WebGL or WebGL2 context, or null if it cannot be obtained.
   */
  public static getWebGLContext(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
    const contextAttributes: WebGLContextAttributes = {};

    try {
      // Try to get WebGL2 first
      const gl = canvas.getContext('webgl2', contextAttributes);
      if (gl) return gl;
    } catch {
      /* Ignore error*/
    }

    try {
      const gl =
        canvas.getContext('webgl', contextAttributes) ??
        canvas.getContext('experimental-webgl', contextAttributes);
      if (gl) return gl as WebGLRenderingContext;
    } catch {
      /* Ignore error */
    }

    return null;
  }

  public collect(): FingerprintComponentValue {
    const canvas = document.createElement('canvas');
    const gl = WebGLSource.getWebGLContext(canvas);

    if (!gl) {
      return { error: 'webgl_not_supported' };
    }

    const collectedData: Record<string, FingerprintComponentValue> = {};

    try {
      // Vendor and Renderer information
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        collectedData.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string;
        collectedData.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
      } else {
        collectedData.vendor = gl.getParameter(gl.VENDOR) as string;
        collectedData.renderer = gl.getParameter(gl.RENDERER) as string;
      }
      collectedData.version = gl.getParameter(gl.VERSION) as string;
      collectedData.shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION) as string;

      // Supported Extensions
      collectedData.supportedExtensions = gl.getSupportedExtensions()?.sort() ?? [];

      // Context Parameters
      const paramsToGet: (keyof WebGLRenderingContext | keyof WebGL2RenderingContext)[] = [
        'MAX_TEXTURE_SIZE',
        'MAX_VIEWPORT_DIMS',
        'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
        'MAX_TEXTURE_IMAGE_UNITS',
        'MAX_RENDERBUFFER_SIZE',
        'MAX_CUBE_MAP_TEXTURE_SIZE',
        'MAX_VERTEX_ATTRIBS',
        'MAX_VERTEX_UNIFORM_VECTORS',
        'MAX_VARYING_VECTORS',
        'MAX_FRAGMENT_UNIFORM_VECTORS',
        'ALIASED_LINE_WIDTH_RANGE',
        'ALIASED_POINT_SIZE_RANGE',
      ];
      const contextParams: Record<string, FingerprintComponentValue> = {};
      paramsToGet.forEach((paramKey) => {
        try {
          const value = gl.getParameter(
            gl[paramKey as keyof WebGLRenderingContext] as unknown as GLenum
          ) as number | string | Float32Array | Int32Array;
          contextParams[paramKey] =
            value instanceof Float32Array || value instanceof Int32Array
              ? Array.from(value)
              : value;
        } catch {
          /* Ignore */
        }
      });
      collectedData.contextParameters = contextParams;

      // Shader Precision
      const shaderTypes = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER];
      const precisionTypes = [
        gl.HIGH_FLOAT,
        gl.MEDIUM_FLOAT,
        gl.LOW_FLOAT,
        gl.HIGH_INT,
        gl.MEDIUM_INT,
        gl.LOW_INT,
      ];
      const shaderPrecision: Record<string, FingerprintComponentValue> = {};
      shaderTypes.forEach((shaderType) => {
        const shaderTypeName = shaderType === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
        precisionTypes.forEach((precisionType) => {
          try {
            const precision = gl.getShaderPrecisionFormat(shaderType, precisionType);
            const precisionName = Object.keys(gl).find(
              (key) => gl[key as keyof WebGLRenderingContext] === precisionType
            );
            if (precision && precisionName) {
              shaderPrecision[`${shaderTypeName}_${precisionName}`] = {
                rangeMin: precision.rangeMin,
                rangeMax: precision.rangeMax,
                precision: precision.precision,
              };
            }
          } catch {
            /* Ignore */
          }
        });
      });
      collectedData.shaderPrecision = shaderPrecision;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'webgl_unknown_error';
      collectedData.error = `webgl_collection_error: ${errorMessage}`;
    } finally {
      try {
        const loseContextExt = gl.getExtension('WEBGL_lose_context');
        if (loseContextExt) loseContextExt.loseContext();
      } catch {
        /* Ignore */
      }
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
    return collectedData;
  }
}
