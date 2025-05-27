export const compress = async (
  str: string,
  encoding: CompressionFormat = "gzip"
): Promise<ArrayBuffer> => {
  const byteArray = new TextEncoder().encode(str);
  const cs = new CompressionStream(encoding);
  const writer = cs.writable.getWriter();
  void writer.write(byteArray);
  void writer.close();
  return new Response(cs.readable).arrayBuffer();
};
