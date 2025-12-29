"use client";

interface FormInputProps {
  label: string;
  type?: string;
  register: any;
  name: string;
  error?: string | undefined;
  id?: string;
}

export default function FormInput({
  label,
  type = "text",
  register,
  name,
  error,
  id,
}: FormInputProps) {
  return (
    <div className="mb-3 relative z-10">
      <label htmlFor={id || name} className="block mb-1 font-medium text-sm md:text-base text-gray-900 dark:text-white">
        {label}
      </label>
      <input
        id={id || name}
        type={type}
        {...register(name)}
        aria-invalid={!!error}
        className="w-full border dark:border-gray-600 p-2 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple dark:focus:ring-accent-cyan focus:border-transparent outline-none transition-all duration-300 hover:shadow-md"
      />
      {error && <p className="text-red-500 dark:text-red-400 text-sm mt-1 animate-slide-in">{error}</p>}
    </div>
  );
}
