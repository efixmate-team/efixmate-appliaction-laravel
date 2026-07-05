<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="UserLoginModal"
        source="components/user/UserLoginModal.tsx"
        area="component"
        :params="props.params"
    />
</template>