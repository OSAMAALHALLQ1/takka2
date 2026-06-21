// src/utils/image-compressor.js

export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.8,      // 80% جودة — فرق غير محسوس بالعين
      maxSizeKB = 150     // حد أقصى 150 KB
    } = options;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // احسب الأبعاد الجديدة مع الحفاظ على النسبة
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // اضغط تدريجياً لحد ما توصل للحجم المطلوب
        let currentQuality = quality;
        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) { reject(new Error('فشل الضغط')); return; }
              
              const sizeKB = blob.size / 1024;
              
              if (sizeKB > maxSizeKB && currentQuality > 0.3) {
                currentQuality -= 0.1;
                compress(); // جرب مرة ثانية بجودة أقل
              } else {
                // حوّل لـ File object
                const compressedFile = new File(
                  [blob], 
                  file.name.replace(/\.[^.]+$/, '.webp'),
                  { type: 'image/webp' }
                );
                resolve({
                  file: compressedFile,
                  originalSizeKB: Math.round(file.size / 1024),
                  compressedSizeKB: Math.round(sizeKB),
                  savedPercent: Math.round((1 - sizeKB / (file.size/1024)) * 100)
                });
              }
            },
            'image/webp',
            currentQuality
          );
        };
        compress();
      };
      img.onerror = () => reject(new Error('صورة غير صالحة'));
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
  });
};
