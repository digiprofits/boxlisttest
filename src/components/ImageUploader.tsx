type Props = {
  onFiles: (files: File[]) => Promise<void> | void;
  label?: string;
  multiple?: boolean;
};

export default function ImageUploader({ onFiles, label = 'Add Image', multiple = true }: Props) {
  return (
    <button
      className="btn btn-ghost"
      onClick={() => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*';
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
