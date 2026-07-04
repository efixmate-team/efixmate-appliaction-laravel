<script setup>
import { useForm } from '@inertiajs/vue3';

const form = useForm({
    email: '',
    password: '',
});

function submit() {
    form.post('/login', {
        onFinish: () => form.reset('password'),
    });
}
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div class="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h1 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">eFixMate Admin</h1>

            <form @submit.prevent="submit" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                        v-model="form.email"
                        type="email"
                        autofocus
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <p v-if="form.errors.email" class="mt-1 text-sm text-red-600">{{ form.errors.email }}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                        v-model="form.password"
                        type="password"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <button
                    type="submit"
                    :disabled="form.processing"
                    class="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900"
                >
                    Sign in
                </button>
            </form>
        </div>
    </div>
</template>
