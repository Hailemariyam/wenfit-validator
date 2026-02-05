# Vue Integration

Wenfit Validator provides a `useValidation` composable for seamless form validation in Vue applications.

## Installation

```bash
npm install wenfit-validator vue
```

## Basic Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useValidation } from 'wenfit-validator/adapters/vue';
import { string, object } from 'wenfit-validator';

const loginSchema = object({
  email: string().email(),
  password: string().min(8),
});

const { validate, errors, getFieldError, clearErrors } = useValidation({ schema: loginSchema });

const formData = ref({
  email: '',
  password: '',
});

const handleSubmit = async () => {
  const result = await validate(formData.value);

  if (result.success) {
    console.log('Login successful:', result.data);
    // Handle successful login
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label for="email">Email</label>
      <input
        id="email"
        v-model="formData.email"
        type="email"
        :class="{ error: getFieldError('email') }"
      />
      <span v-if="getFieldError('email')" class="error-message">
        {{ getFieldError('email')?.message }}
      </span>
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input
        id="password"
        v-model="formData.password"
        type="password"
        :class="{ error: getFieldError('password') }"
      />
      <span v-if="getFieldError('password')" class="error-message">
        {{ getFieldError('password')?.message }}
      </span>
    </div>

    <button type="submit">Login</button>
  </form>
</template>
```

## API Reference

### useValidation(options)

Creates a validation composable for your component.

**Parameters:**

```typescript
interface UseValidationOptions<T> {
  schema: Schema<any, T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit'; // default: 'onSubmit'
}

function useValidation<T>(options: UseValidationOptions<T>): UseValidationReturn<T>;
```

**Returns:**

```typescript
interface UseValidationReturn<T> {
  validate: (data: unknown) => Promise<ValidationResult<T>>;
  errors: Ref<ValidationErrorData[]>;
  isValidating: Ref<boolean>;
  getFieldError: (path: string) => ComputedRef<ValidationErrorData | undefined>;
  clearErrors: () => void;
  mode: ValidationMode;
}
```

**Note:** `getFieldError` returns a `ComputedRef`, so you need to access its `.value` property in templates.

## Reactive Validation

All returned values are reactive refs that automatically update your UI:

```vue
<script setup>
import { watch } from 'vue';
import { useValidation } from 'wenfit-validator/adapters/vue';

const { validate, errors, isValidating } = useValidation({ schema: mySchema });

// Validate on every change
watch(formData, async (newData) => {
  await validate(newData);
}, { deep: true });
</script>

<template>
  <div>
    <p v-if="isValidating">Validating...</p>
    <p v-if="errors.length > 0">{{ errors.length }} errors found</p>
  </div>
</template>
```

## Field-Level Errors

Use `getFieldError()` to access errors for specific fields. Note that it returns a `ComputedRef`, so you need to access `.value`:

```vue
<script setup>
const { getFieldError } = useValidation({ schema: mySchema });
</script>

<template>
  <div>
    <input v-model="formData.email" />
    <span v-if="getFieldError('email').value" class="error">
      {{ getFieldError('email').value?.message }}
    </span>
  </div>
</template>
```

For nested fields, use dot notation:

```vue
<template>
  <div>
    <input v-model="formData.profile.email" />
    <span v-if="getFieldError('profile.email').value">
      {{ getFieldError('profile.email').value?.message }}
    </span>
  </div>
</template>
```

## Async Validation

The composable automatically handles async validation:

```vue
<script setup>
const asyncSchema = object({
  username: string().refine(
    async (val) => {
      const isAvailable = await checkUsernameAvailable(val);
      return isAvailable;
    },
    'Username is already taken'
  ),
});

const { validate, isValidating } = useValidation({ schema: asyncSchema });
</script>

<template>
  <form>
    <input v-model="formData.username" />
    <span v-if="isValidating" class="loading">
      Checking availability...
    </span>
    <button type="submit" :disabled="isValidating">
      Register
    </button>
  </form>
</template>
```

## Real-Time Validation

Validate as the user types:

```vue
<script setup>
import { watch } from 'vue';

const formData = ref({
  email: '',
  password: '',
});

const { validate, getFieldError } = useValidation({ schema: loginSchema });

// Validate on change with debounce
watch(formData, async (newData) => {
  await validate(newData);
}, { deep: true });
</script>
```

With debounce for better performance:

```vue
<script setup>
import { watchDebounced } from '@vueuse/core';

watchDebounced(
  formData,
  async (newData) => {
    await validate(newData);
  },
  { debounce: 300, deep: true }
);
</script>
```

## Error Display Patterns

### Inline Errors

```vue
<template>
  <div class="form-field">
    <input v-model="formData.email" />
    <transition name="fade">
      <div v-if="getFieldError('email').value" class="error-message">
        <svg class="error-icon">...</svg>
        {{ getFieldError('email').value?.message }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

### Error Summary

```vue
<script setup>
const { errors } = useValidation({ schema: mySchema });
</script>

<template>
  <div v-if="errors.length > 0" class="error-summary">
    <h4>Please fix the following errors:</h4>
    <ul>
      <li v-for="(error, index) in errors" :key="index">
        <strong>{{ error.path.join('.') }}</strong>: {{ error.message }}
      </li>
    </ul>
  </div>
</template>
```

### Toast Notifications

```vue
<script setup>
import { useToast } from 'your-toast-library';

const toast = useToast();
const { validate } = useValidation({ schema: mySchema });

const handleSubmit = async () => {
  const result = await validate(formData.value);

  if (!result.success) {
    result.errors.forEach(error => {
      toast.error(error.message);
    });
  } else {
    toast.success('Form submitted successfully!');
  }
};
</script>
```

## Clearing Errors

Clear all errors manually:

```vue
<script setup>
const { clearErrors } = useValidation({ schema: mySchema });

const handleReset = () => {
  clearErrors();
  formData.value = {
    email: '',
    password: '',
  };
};
</script>

<template>
  <button type="button" @click="handleReset">
    Reset Form
  </button>
</template>
```

## TypeScript Integration

Full type safety with inferred types:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useValidation } from 'wenfit-validator/adapters/vue';
import { string, number, object, type Infer } from 'wenfit-validator';

const userSchema = object({
  username: string().min(3),
  email: string().email(),
  age: number().int().min(18),
});

type UserFormData = Infer<typeof userSchema>;

const formData = ref<UserFormData>({
  username: '',
  email: '',
  age: 18,
});

const { validate } = useValidation({ schema: userSchema });

const handleSubmit = async () => {
  const result = await validate(formData.value);

  if (result.success) {
    // result.data is typed as UserFormData
    const user: UserFormData = result.data;
    console.log(user.username); // TypeScript knows this is a string
  }
};
</script>
```

## Composition API Patterns

### Reusable Validation Composable

```typescript
// composables/useFormValidation.ts
import { ref } from 'vue';
import { useValidation } from 'wenfit-t.data);
        clearErrors();
      }
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    validate,
    errors,
    getFieldError,
    clearErrors,
    isSubmitting,
    handleSubmit,
  };
}
```

Usage:

```vue
<script setup>
import { useFormValidation } from '@/composables/useFormValidation';

const { handleSubmit, getFieldError, isSubmitting } = useFormValidation(loginSchema);

const onSubmit = () => {
  handleSubmit(formData.value, async (data) => {
    await api.login(data);
    router.push('/dashboard');
  });
};
</script>
```

## Complete Example

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useValidation } from 'wenfit-validator/adapters/vue';
import { string, number, boolean, object, type Infer } from 'wenfit-validator';

const registrationSchema = object({
  username: string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: string().email('Please enter a valid email address'),
  password: string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: string(),
  age: number()
    .int('Age must be a whole number')
    .min(18, 'You must be at least 18 years old'),
  acceptTerms: boolean().refine(
    (val) => val,
    'You must accept the terms and conditions'
  ),
}).refine(
  (data) => data.password === data.confirmPassword,
  'Passwords must match'
);

type RegistrationData = Infer<typeof registrationSchema>;

const formData = ref<Partial<RegistrationData>>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: undefined,
  acceptTerms: false,
});

const { validate, errors, isValidating, getFieldError, clearErrors } =
  useValidation({ schema: registrationSchema });

const handleSubmit = async () => {
  const result = await validate(formData.value);

  if (result.success) {
    console.log('Registration successful:', result.data);
    // Submit to API
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
```

## Next Steps

- [Angular Integration](./angular.md) - Use with Angular
- [Error Handling](../concepts/errors.md) - Learn about error handling
- [Examples](../../examples/vue-form-validation.vue) - More examples
