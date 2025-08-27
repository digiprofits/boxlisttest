import { useEffect, useState } from 'react';
import { listImagesFor, removeImage } from '@/store';

type Props = {
  parentType: 'box' | 'item';
  parentId: string;
  /** Change this value (e.g., increment a number) to force the grid to reload */
  refreshToken?: number | string;
};

export default function ImageGrid({ parentType, parentId, refreshToken }: Props) {
  const [images, setImages] = useState<{ id: string; dataUrl: string }[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  async function refresh() {
    const list = await listImagesFor(parentType, parentId);
    setImages(list.sort((a, b) => b.createdAt - a.createdAt));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentType, parentId, refreshToken]);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((im) => (
          <div key={im.id} className="relative group">
            <img
              src={im.dataUrl}
              alt=""
              className="w-full h-24 object-cover rounded-md border cursor-pointer"
              onClick={() => setLightbox(im.dataUrl)}
            />
            <button
              className="absolute top-1 right-1 hidden group-hover:block text-xs px-2 py-1 bg-white/85 rounded border"
              onClick={async (e) => {
                e.stopPropagation();
                await removeImage(im.id);
                await refresh();
              }}
              title="Delete image"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length === 0 && (
          <div className="text-sm text-neutral-500 col-span-3">No images yet.</div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            className="max-h-full max-w-full rounded-lg border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-3 right-3 text-white text-xl"
            aria-label="Close"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
