type EmojiBrandProps = {
  size?: number;
  className?: string;
};

const EmojiBrand = ({ size = 44, className = "" }: EmojiBrandProps) => {
  return (
    <div
      className={`overflow-hidden rounded-2xl shadow-lg shadow-fuchsia-300/25 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      <img
        src="/brand/pix-kids-logo.png"
        alt=""
        className="h-full w-full object-cover"
      />
    </div>
  );
};

export default EmojiBrand;
