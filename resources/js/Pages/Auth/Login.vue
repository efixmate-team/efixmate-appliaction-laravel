<script setup>
import { ref, onMounted } from 'vue';
import { useForm } from '@inertiajs/vue3';

const props = defineProps({
    adminUid: {
        type: String,
        default: null,
    },
});

// Mirrors the source Next.js login/[uid] page: the uid segment is checked
// against efm_admins *before* the credential form is shown at all — an
// unknown/expired link never gets a chance to try a password.
const validationState = ref(props.adminUid ? 'loading' : 'no-uid');

async function verifyUid() {
    validationState.value = 'loading';
    try {
        const response = await fetch('/check-uid', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: props.adminUid }),
        });
        const data = await response.json();

        if (!response.ok) {
            validationState.value = 'server-error';
            return;
        }
        validationState.value = data.exists ? 'valid' : 'invalid';
    } catch {
        validationState.value = 'server-error';
    }
}

onMounted(() => {
    if (props.adminUid) verifyUid();
});

const form = useForm({
    email: '',
    password: '',
    admin_uid: props.adminUid,
});

function submit() {
    form.post('/admin/login', {
        onFinish: () => form.reset('password'),
    });
}
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <!-- Verifying the link -->
        <div v-if="validationState === 'loading'" class="flex flex-col items-center gap-3">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-white" />
            <p class="text-sm text-gray-500 dark:text-gray-400">Verifying secure access…</p>
        </div>

        <!-- Invalid / expired link -->
        <div v-else-if="validationState === 'invalid'" class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950">
                <svg class="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
            </div>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">Invalid Access Link</h1>
            <p class="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                This login URL is invalid, expired, or no longer available.
            </p>
            <a
                href="/"
                class="mt-6 block w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
            >
                Go to Homepage
            </a>
        </div>

        <!-- Couldn't reach the server -->
        <div v-else-if="validationState === 'server-error'" class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950">
                <svg class="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
                </svg>
            </div>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">Server Unreachable</h1>
            <p class="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Unable to verify your login request right now. Check your connection and try again.
            </p>
            <button
                @click="verifyUid"
                class="mt-6 w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
            >
                Retry
            </button>
        </div>

        <!-- Valid link (or the generic /admin/login entry with no uid) -->
        <div v-else class="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h1 class="mb-1 text-lg font-semibold text-gray-900 dark:text-white">eFixMate Admin</h1>
            <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Sign in with the email and password for this login link.
            </p>

            <div
                v-if="validationState === 'no-uid'"
                class="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
            >
                This isn't a personal login link. Use the link from your invite email, or ask an administrator to resend it.
            </div>

            <form @submit.prevent="submit" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                        v-model="form.email"
                        type="email"
                        autofocus
                        autocomplete="username"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <p v-if="form.errors.email" class="mt-1 text-sm text-red-600">{{ form.errors.email }}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                        v-model="form.password"
                        type="password"
                        autocomplete="current-password"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <p v-if="form.errors.password" class="mt-1 text-sm text-red-600">{{ form.errors.password }}</p>
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
