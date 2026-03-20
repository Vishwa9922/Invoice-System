const Loader = ({ size = 32, fullPage = false }) => {
  const spinner = (
    <div
      className="border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"
      style={{ width: size, height: size }}
    />
  );

  if (fullPage) return (
    <div className="flex items-center justify-center min-h-[200px]">
      {spinner}
    </div>
  );

  return spinner;
};

export default Loader;