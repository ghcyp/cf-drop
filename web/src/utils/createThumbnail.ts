export async function createThumbnail(imgSrc: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imgSrc;
  });

  const ctx = canvas.getContext('2d')!;

  // ctx.fillStyle = 'white';
  // ctx.fillRect(0, 0, canvas.width, canvas.height);

  const destRatio = canvas.width / canvas.height;
  const srcRatio = img.width / img.height;

  let imgWidth = img.width;
  let imgHeight = img.height;
  let imgLeft = 0;
  let imgTop = 0;

  if (srcRatio > destRatio) {
    imgWidth = canvas.width;
    imgHeight = imgWidth / srcRatio;
    imgTop = (canvas.height - imgHeight) / 2;
  } else {
    imgHeight = canvas.height;
    imgWidth = imgHeight * srcRatio;
    imgLeft = (canvas.width - imgWidth) / 2;
  }

  ctx.drawImage(img, imgLeft, imgTop, imgWidth, imgHeight);

  try {
    return canvas.toDataURL('image/webp', 0.6);
  } catch (e) {
    return canvas.toDataURL('image/png');
  }
}