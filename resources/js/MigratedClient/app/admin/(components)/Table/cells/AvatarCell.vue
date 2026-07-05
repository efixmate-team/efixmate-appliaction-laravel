<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="AvatarCell"
        source="app/admin/(components)/Table/cells/AvatarCell.jsx"
        area="component"
        :params="props.params"
    />
</template>