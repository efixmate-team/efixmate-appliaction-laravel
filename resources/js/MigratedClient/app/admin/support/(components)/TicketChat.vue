<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="TicketChat"
        source="app/admin/support/(components)/TicketChat.tsx"
        area="component"
        :params="props.params"
    />
</template>