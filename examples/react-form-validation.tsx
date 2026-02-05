/**
 * React Form Validation Example
 *
 * This example demonstrates how to use Wenfit Validator with React
 * for form validation with real-time feedback.
 */

import React, { useState } from 'react';
import { useValidator } from 'wenfit-validator/adapters/react';
import { string, number, object, boolean, type Infer } from 'wenfit-validator';

// Define the validation schema
const registrationSchema = object({
    username: string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

    email: string()
        .email('Please enter a valid email address'),

    password: string()
        .min(8, 'Password must be at least 8 characters')
        .refine(
            (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
            'Password must contain uppercase, lowercase, and a number'
        ),

    confirmPassword: string(),

    age: number()
        .int('Age must be a whole number')
        .min(18, 'You must be at least 18 years old')
        .max(120, 'Please enter a valid age'),

    acceptTerms: boolean()
        .refine((val) => val, 'You must accept the terms and conditions'),
}).refine(
    (data) => data.password === data.confirmPassword,
    'Passwords must match'
);

// Infer TypeScript type from schema
type RegistrationForm = Infer<typeof registrationSchema>;

export function RegistrationForm() {
    const [formData, setFormData] = useState<Partial<RegistrationForm>>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        age: undefined,
        acceptTerms: false,
    });

    // Initialize validator hook
    const { validate, errors, isValidating, getFieldError, clearErrors } = useValidator({
        schema: registrationSchema,
        mode: 'onChange', // Validate on every change
    });

    const handleChange = (field: keyof RegistrationForm) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = e.target.type === 'checkbox'
            ? e.target.checked
            : e.target.type === 'number'
                ? Number(e.target.value)
                : e.target.value;

        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await validate(formData);

        if (result.success) {
            console.log('Form submitted successfully:', result.data);
            // Send data to API
            alert('Registration successful!');
            clearErrors();
            setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                age: undefined,
                acceptTerms: false,
            });
        } else {
            console.error('Validation errors:', result.errors);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="registration-form">
            <h2>Create Account</h2>

            <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                    id="username"
                    type="text"
                    value={formData.username || ''}
                    onChange={handleChange('username')}
                    className={getFieldError('username') ? 'error' : ''}
                />
                {getFieldError('username') && (
                    <span className="error-message">
                        {getFieldError('username')?.message}
                    </span>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange('email')}
                    className={getFieldError('email') ? 'error' : ''}
                />
                {getFieldError('email') && (
                    <span className="error-message">
                        {getFieldError('email')?.message}
                    </span>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={handleChange('password')}
                    className={getFieldError('password') ? 'error' : ''}
                />
                {getFieldError('password') && (
                    <span className="error-message">
                        {getFieldError('password')?.message}
                    </span>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword || ''}
                    onChange={handleChange('confirmPassword')}
                    className={getFieldError('confirmPassword') ? 'error' : ''}
                />
                {getFieldError('confirmPassword') && (
                    <span className="error-message">
                        {getFieldError('confirmPassword')?.message}
                    </span>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                    id="age"
                    type="number"
                    value={formData.age || ''}
                    onChange={handleChange('age')}
                    className={getFieldError('age') ? 'error' : ''}
                />
                {getFieldError('age') && (
                    <span className="error-message">
                        {getFieldError('age')?.message}
                    </span>
                )}
            </div>

            <div className="form-group checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={formData.acceptTerms || false}
                        onChange={handleChange('acceptTerms')}
                    />
                    I accept the terms and conditions
                </label>
                {getFieldError('acceptTerms') && (
                    <span className="error-message">
                        {getFieldError('acceptTerms')?.message}
                    </span>
                )}
            </div>

            <button type="submit" disabled={isValidating}>
                {isValidating ? 'Validating...' : 'Register'}
            </button>

            {errors.length > 0 && (
                <div className="error-summary">
                    <h4>Please fix the following errors:</h4>
                    <ul>
                        {errors.map((error, index) => (
                            <li key={index}>{error.message}</li>
                        ))}
                    </ul>
                </div>
            )}
        </form>
    );
}

// Example CSS (add to your stylesheet)
const styles = `
.registration-form {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.form-group input.error {
    border-color: #dc3545;
}

.error-message {
    display: block;
    color: #dc3545;
    font-size: 14px;
    margin-top: 5px;
}

.error-summary {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    padding: 15px;
    margin-top: 20px;
}

.error-summary h4 {
    margin-top: 0;
    color: #721c24;
}

.error-summary ul {
    margin-bottom: 0;
}

button[type="submit"] {
    width: 100%;
    padding: 12px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
}

button[type="submit"]:hover {
    background-color: #0056b3;
}

button[type="submit"]:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
}
`;
