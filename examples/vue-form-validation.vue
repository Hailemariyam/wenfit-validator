<!--
  Vue Form Validation Example

  This example demonstrates how to use Wenfit Validator with Vue
  for form validation with real-time feedback.
-->

<script setup lang="ts">
import { ref } from 'vue';
import { useValidation } from 'wenfit-validator/adapters/vue';
import { string, number, boolean, object, type Infer } from 'wenfit-validator';

// Define the validation schema
const registrationSchema = object({
  username: string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
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

// Form data
const formData = ref<Partial<RegistrationForm>>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: undefined,
  acceptTerms: false,
});

// Initialize validation composable
const { validate, errors, isValidating, getFieldError, clearErrors } =
  useValidation({ schema: registrationSchema });

// Handle form submission
const handleSubmit = async () => {
  const result = await validate(formData.value);

  if (result.success) {
    console.log('Form submitted successfully:', result.data);
    // Send data to API
    alert('Registration successful!');
    clearErrors();

    // Reset form
    formData.value = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      age: undefined,
      acceptTerms: false,
    };
  } else {
    console.error('Validation errors:', result.errors);
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="registration-form">
    <h2>Create Account</h2>

    <div class="form-group">
      <label for="username">Username</label>
      <input
        id="username"
        v-model="formData.username"
        type="text"
        :class="{ error: getFieldError('username').value }"
      />
      <span v-if="getFieldError('username').value" class="error-message">
        {{ getFieldError('username').value?.message }}
      </span>
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input
        id="email"
        v-model="formData.email"
        type="email"
        :class="{ error: getFieldError('email').value }"
      />
      <span v-if="getFieldError('email').value" class="error-message">
        {{ getFieldError('email').value?.message }}
      </span>
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input
        id="password"
        v-model="formData.password"
        type="password"
        :class="{ error: getFieldError('password').value }"
      />
      <span v-if="getFieldError('password').value" class="error-message">
        {{ getFieldError('password').value?.message }}
      </span>
    </div>

    <div class="form-group">
      <label for="confirmPassword">Confirm Password</label>
      <input
        id="confirmPassword"
        v-model="formData.confirmPassword"
        type="password"
        :class="{ error: getFieldError('confirmPassword').value }"
      />
      <span v-if="getFieldError('confirmPassword').value" class="error-message">
        {{ getFieldError('confirmPassword').value?.message }}
      </span>
    </div>

    <div class="form-group">
      <label for="age">Age</label>
      <input
        id="age"
        v-model.number="formData.age"
        type="number"
        :class="{ error: getFieldError('age').value }"
      />
      <span v-if="getFieldError('age').value" class="error-message">
        {{ getFieldError('age').value?.message }}
      </span>
    </div>

    <div class="form-group checkbox">
      <label>
        <input
          v-model="formData.acceptTerms"
          type="checkbox"
        />
        I accept the terms and conditions
      </label>
      <span v-if="getFieldError('acceptTerms').value" class="error-message">
        {{ getFieldError('acceptTerms').value?.message }}
      </span>
    </div>

    <button type="submit" :disabled="isValidating">
      {{ isValidating ? 'Validating...' : 'Register' }}
    </button>

    <div v-if="errors.length > 0" class="error-summary">
      <h4>Please fix the following errors:</h4>
      <ul>
        <li v-for="(error, index) in errors" :key="index">
          {{ error.message }}
        </li>
      </ul>
    </div>
  </form>
</template>

<style scoped>
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
</style>
