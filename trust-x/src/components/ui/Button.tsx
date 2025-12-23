interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: React.ReactNode;
  variant?: "primary" | "secondary";
}

export default function Button({ label, variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2";
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {label}
    </button>
  );
}
