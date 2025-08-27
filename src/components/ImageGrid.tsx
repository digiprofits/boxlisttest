import { useEffect, useState } from 'react';
import { listImagesFor, removeImage } from '@/store';

type Props = {
  parentType: 'box' | 'item';
  parentId: string;
};

export default function ImageGrid({ parentType, parentId }: Props) {
  const [images, setImages] = useState<{ id: string; dataUrl: string }[]>([]);

  async function refresh() {
    const list = await listImagesFor(parentType, parentId);
    setImages(list.sort((a,b) => b.createdAt - a.createdAt));
  }

  useEffect(() => { refresh(); }, [parentType, parentId]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((im) => (
        <div key={im.id} className="relative group">
          <img
            src={im.dataUrl}
            alt=""
            className="w-full h-24 object-cover rounded-md border cursor-pointer"
            onClick={() => window.open(im.dataUrl, '_blank')}
          />
          <button
            className="absolute top-1 right-1 hidden group-hover:block text-xs px-2 py-1 bg-white/80 rounded border"
            onClick={async () => { await removeImage(im.id); await refresh(); }}
            title="Delete image"
          >
            ✕
          </button>
        </div>
      ))}
      {images.length === 0 && <div className="text-sm text-neutral-500 col-span-3">No images yet.</div>}
    </div>
  );
}
