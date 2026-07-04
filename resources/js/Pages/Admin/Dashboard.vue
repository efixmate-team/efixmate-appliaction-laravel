<script setup>
import { router } from '@inertiajs/vue3';

defineProps({
    admin: Object,
});

function logout() {
    router.post('/logout');
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
            <h1 class="text-base font-semibold text-gray-900 dark:text-white">eFixMate Admin</h1>
            <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span>{{ admin.first_name }} {{ admin.last_name }} ({{ admin.admin_type }})</span>
                <button @click="logout" class="text-red-600 hover:underline">Sign out</button>
            </div>
        </header>

        <main class="p-6">
            <p class="text-sm text-gray-500 dark:text-gray-400">Signed in as {{ admin.email }}.</p>
        </main>
    </div>
</template>
