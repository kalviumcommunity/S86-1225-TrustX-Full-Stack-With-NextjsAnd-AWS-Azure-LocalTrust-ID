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
  } = useForm<SignupFormData>({ 
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'USER',
    },
  });

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
    <main className="p-4 md:p-6 lg:p-8 flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan animate-gradient animate-slide-in">
        🔒 Create Your Account
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-full max-w-sm md:max-w-md bg-white dark:bg-gray-800 p-4 md:p-6 border-2 border-transparent rounded-xl shadow-2xl hover:shadow-accent-purple/30 dark:hover:shadow-accent-cyan/30 transition-all duration-500 animate-slide-in relative overflow-hidden group"
        style={{ borderImage: 'linear-gradient(135deg, #a855f7, #ec4899, #06b6d4) 1' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 via-accent-pink/5 to-accent-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {serverError && <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 animate-slide-in">{serverError}</div>}
        {serverSuccess && <div className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 animate-slide-in">{serverSuccess}</div>}

        <FormInput label="Name" name="name" register={register} error={errors.name?.message as any} />
        <FormInput label="Email" name="email" type="email" register={register} error={errors.email?.message as any} />
        <FormInput label="Password" name="password" type="password" register={register} error={errors.password?.message as any} />

        <div className="relative z-10">
          <label className="block mb-1 font-medium text-sm md:text-base text-gray-900 dark:text-white">Account Type</label>
          <select {...register('role')} className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg focus:ring-2 focus:ring-accent-purple dark:focus:ring-accent-cyan outline-none transition-all duration-300">
            <option value="USER">Regular User</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>

        <button
          disabled={isSubmitting}
          className="relative z-10 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan hover:from-accent-purple/90 hover:via-accent-pink/90 hover:to-accent-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm md:text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg animate-gradient overflow-hidden group"
        >
          <span className="relative z-10">{isSubmitting ? '⏳ Submitting...' : '✨ Sign Up'}</span>
          <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
        </button>
      </form>
    </main>
  );
}