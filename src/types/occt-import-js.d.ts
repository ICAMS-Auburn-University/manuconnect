declare module 'occt-import-js' {
  interface OcctImportJsResult {
    meshes: Array<{
      attributes: {
        position: { array: Float32Array };
        normal?: { array: Float32Array };
      };
      index?: { array: Uint32Array };
      color?: [number, number, number];
    }>;
  }

  interface OcctImportJsInstance {
    ReadStepFile: (
      buffer: Uint8Array,
      params: null
    ) => OcctImportJsResult;
  }

  interface OcctImportJsOptions {
    locateFile?: (filename: string) => string;
  }

  function occtImportJs(
    options?: OcctImportJsOptions
  ): Promise<OcctImportJsInstance>;

  export default occtImportJs;
}
