'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormInput from '@/components/FormInput';
import { signupSchema, SignupFormData } from '@/lib/schemas/formSchemas';

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupFormData) => {
    setServerError('');
    setServerSuccess('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setServerSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        setServerError(json.message || 'Signup failed');
      }
    } catch (e) {
      setServerError('Network error. Please try again.');
    }
  };

  return (
    <main className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Signup Form</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-80 bg-white p-6 border rounded-lg"
      >
        {serverError && <div className="text-red-600">{serverError}</div>}
        {serverSuccess && <div className="text-green-600">{serverSuccess}</div>}

        <FormInput label="Name" name="name" register={register} error={errors.name?.message as any} />
        <FormInput label="Email" name="email" type="email" register={register} error={errors.email?.message as any} />
        <FormInput label="Password" name="password" type="password" register={register} error={errors.password?.message as any} />

        <div>
          <label className="block mb-1 font-medium">Account Type</label>
          <select {...register('role')} className="w-full border p-2 rounded">
            <option value="USER">Regular User</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>

        <button
          disabled={isSubmitting}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Sign Up'}
        </button>
      </form>
    </main>
  );
}