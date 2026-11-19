/** Converte a logo para WebP, preservando transparência e limitando o tamanho. */
export async function prepareLogo(file: File): Promise<Blob> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error("Escolha uma imagem PNG, JPG ou WebP de até 5 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.94),
    );
    if (!blob || blob.type !== "image/webp")
      throw new Error("Não foi possível converter a logo neste navegador.");
    if (blob.size > 2 * 1024 * 1024)
      throw new Error("A logo precisa ter até 2 MB após otimização.");
    return blob;
  } finally {
    bitmap.close();
  }
}
