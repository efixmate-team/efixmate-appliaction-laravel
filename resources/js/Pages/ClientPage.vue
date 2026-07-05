<script setup>
import ClientShell from '@/Layouts/ClientShell.vue';
import PublicRouteView from '@/Components/Client/PublicRouteView.vue';
import TechnicianRouteView from '@/Components/Client/TechnicianRouteView.vue';
import UserRouteView from '@/Components/Client/UserRouteView.vue';

const props = defineProps({
    title: { type: String, required: true },
    source: { type: String, required: true },
    area: { type: String, default: 'client' },
    path: { type: String, default: '' },
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <ClientShell :title="props.title" :source="props.source" :area="props.area" :path="props.path">
        <UserRouteView
            v-if="props.area === 'user'"
            :title="props.title"
            :source="props.source"
            :params="props.params"
        />
        <TechnicianRouteView
            v-else-if="props.area === 'technician'"
            :title="props.title"
            :source="props.source"
            :params="props.params"
        />
        <PublicRouteView
            v-else
            :title="props.title"
            :source="props.source"
            :path="props.path"
            :params="props.params"
        />
    </ClientShell>
</template>
