type Props = {
  onFiles: (files: File[]) => Promise<void> | void;
  label?: string;
  multiple?: boolean;
  preferCamera?: boolean; // when true, hint mobile to open camera
};

export default function ImageUploader({
  onFiles,
  label = 'Add Image(s)',
  multiple = true,
  preferCamera = true,
}: Props) {
  return (
    <button
      className="btn btn-ghost"
      onClick={() => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*';
        if (preferCamera) {
          // Hints most mobile browsers to open the camera, with option to choose from library
          // (desktop browsers ignore this attribute)
          (inp as any).capture = 'environment';
        }
        (inp as any).multiple = multiple;
        inp.onchange = async () => {
          const files = inp.files ? Array.from(inp.files) : [];
          if (files.length) await onFiles(files);
        };
        inp.click();
      }}
    >
      {label}
    </button>
  );
}
