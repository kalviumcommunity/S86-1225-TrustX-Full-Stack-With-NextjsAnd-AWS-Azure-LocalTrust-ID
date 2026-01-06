/**
 * FormInput Component Unit Tests
 * 
 * Tests for the reusable form input component
 */

import { render, screen } from '@testing-library/react';
import FormInput from '../../src/components/FormInput';

// Mock react-hook-form register function
const mockRegister = jest.fn((name: string) => ({
  name,
  onChange: jest.fn(),
  onBlur: jest.fn(),
  ref: jest.fn(),
}));

describe('FormInput Component', () => {
  it('should render with label and input', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        register={mockRegister}
      />
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should use correct input type', () => {
    render(
      <FormInput
        label="Password"
        name="password"
        type="password"
        register={mockRegister}
      />
    );

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should display error message when provided', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        register={mockRegister}
        error="Email is required"
      />
    );

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toHaveClass('text-red-500');
  });

  it('should not display error when not provided', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        register={mockRegister}
      />
    );

    const errorElement = screen.queryByText(/Email is required/i);
    expect(errorElement).not.toBeInTheDocument();
  });

  it('should set aria-invalid when error exists', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        register={mockRegister}
        error="Invalid email"
      />
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should not set aria-invalid when no error', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        register={mockRegister}
      />
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('should use custom id when provided', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        id="custom-email-id"
        register={mockRegister}
      />
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'custom-email-id');
  });

  it('should use name as id when custom id not provided', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        register={mockRegister}
      />
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'email');
  });

  it('should call register with correct name', () => {
    render(
      <FormInput
        label="Username"
        name="username"
        register={mockRegister}
      />
    );

    expect(mockRegister).toHaveBeenCalledWith('username');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <FormInput
        label="Email Address"
        name="email"
        register={mockRegister}
      />
    );

    const input = screen.getByLabelText('Email Address');
    const label = screen.getByText('Email Address');

    expect(label).toHaveAttribute('for', 'email');
    expect(input).toHaveAttribute('id', 'email');
  });

  it('should apply CSS classes for styling', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        register={mockRegister}
      />
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('rounded-lg');
  });
});
