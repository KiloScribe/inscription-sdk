export async function fileTypeFromBuffer(): Promise<{ mime: string }> {
  return { mime: 'application/octet-stream' };
}

