export const uncompress = async (
  byteArray: BufferSource,
  encoding = 'gzip' as CompressionFormat
): Promise<string> => {
  try {
    const cs = new DecompressionStream(encoding);
    const writer = cs.writable.getWriter();
    void writer.write(byteArray);
    void writer.close();
    const arrayBuffer = await new Response(cs.readable).arrayBuffer();
    return new TextDecoder().decode(arrayBuffer);
  } catch (e) {
    console.error('Error decompressing', e);
    return '';
  }
};
