<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ContactInquiryShell"
        source="app/admin/contact-inquiries/(components)/ContactInquiryShell.tsx"
        area="component"
        :params="props.params"
    />
</template>