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
    <div className="mb-3">
      <label htmlFor={id || name} className="block mb-1 font-medium text-gray-900">
        {label}
      </label>
      <input
        id={id || name}
        type={type}
        {...register(name)}
        aria-invalid={!!error}
        className="w-full border p-2 rounded text-gray-900 placeholder-gray-500 bg-white"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
