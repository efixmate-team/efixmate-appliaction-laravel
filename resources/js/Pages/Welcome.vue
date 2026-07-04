<script setup>
defineProps({
    laravelVersion: String,
    phpVersion: String,
});
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div class="text-center">
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">eFixMate Admin</h1>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Laravel {{ laravelVersion }} · PHP {{ phpVersion }} · Inertia + Vue + Tailwind
            </p>
        </div>
    </div>
</template>
