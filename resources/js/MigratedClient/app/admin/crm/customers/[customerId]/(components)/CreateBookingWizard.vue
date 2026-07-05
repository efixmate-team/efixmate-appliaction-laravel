<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="CreateBookingWizard"
        source="app/admin/crm/customers/[customerId]/(components)/CreateBookingWizard.tsx"
        area="component"
        :params="props.params"
    />
</template>