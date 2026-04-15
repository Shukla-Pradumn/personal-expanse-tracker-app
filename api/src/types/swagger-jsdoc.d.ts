//this is for the swagger-jsdoc module
declare module 'swagger-jsdoc' {
  // Minimal typing for OpenAPI spec builder; full shape is runtime-defined.
  function swaggerJSDoc(options: unknown): Record<string, unknown>;
  export default swaggerJSDoc;
}
