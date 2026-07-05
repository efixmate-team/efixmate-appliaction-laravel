<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="DatePicker"
        source="app/admin/(components)/Forms/DatePicker.jsx"
        area="component"
        :params="props.params"
    />
</template>