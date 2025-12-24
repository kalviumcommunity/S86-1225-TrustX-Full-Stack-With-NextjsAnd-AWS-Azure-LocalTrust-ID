"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormInput from '@/components/FormInput';
import { contactSchema, ContactFormData } from '@/lib/schemas/formSchemas';

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data: ContactFormData) => {
    console.log('Contact Form Submitted:', data);
    alert('Message Sent Successfully!');
  };

  return (
    <main className="p-6 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Contact Us</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-96 bg-white p-6 border rounded-lg"
      >
        <FormInput label="Name" name="name" register={register} error={errors.name?.message as any} />
        <FormInput label="Email" name="email" type="email" register={register} error={errors.email?.message as any} />
        <div className="mb-3">
          <label className="block mb-1 font-medium">Message</label>
          <textarea {...register('message')} className="w-full border p-2 rounded text-gray-900 placeholder-gray-500 bg-white" rows={4} />
          {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
        </div>
        <button
          disabled={isSubmitting}
          className="bg-green-600 text-white px-4 py-2 mt-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending...' : 'Submit'}
        </button>
      </form>
    </main>
  );
}
