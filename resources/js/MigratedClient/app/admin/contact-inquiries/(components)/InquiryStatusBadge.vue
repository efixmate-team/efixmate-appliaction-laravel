<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="InquiryStatusBadge"
        source="app/admin/contact-inquiries/(components)/InquiryStatusBadge.tsx"
        area="component"
        :params="props.params"
    />
</template>