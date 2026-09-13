/**
 * Utilitário de Compressão e Redimensionamento de Imagens Client-Side
 * Permite armazenar fotos de produtos diretamente no IndexedDB e PostgreSQL (offline-first)
 * Reduz fotos de celulares (3MB - 10MB) para apenas ~40KB - 80KB com alta fidelidade visual.
 */

export function compressAndResizeImage(file, maxDimension = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('O arquivo selecionado não é uma imagem válida.'));
    }

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcula proporções mantendo o aspect ratio original
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Falha ao obter contexto 2D do Canvas.'));
        }

        // Fundo branco para imagens com transparência (PNG) convertidas para JPEG/WebP
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);

        // Desenha imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Tenta WebP primeiro (mais leve e moderno), fallback para JPEG
        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Estima tamanho em KB a partir da string base64
        const head = 'data:image/webp;base64,';
        const rawLength = dataUrl.length - (dataUrl.indexOf(',') + 1);
        const sizeBytes = Math.round((rawLength * 3) / 4);
        const sizeKB = Math.round(sizeBytes / 1024);

        resolve({
          dataUrl,
          width,
          height,
          sizeKB,
          originalSizeKB: Math.round(file.size / 1024),
        });
      };

      img.onerror = () => {
        reject(new Error('Erro ao decodificar arquivo de imagem.'));
      };

      img.src = readerEvent.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo do disco.'));
    };

    reader.readAsDataURL(file);
  });
}
