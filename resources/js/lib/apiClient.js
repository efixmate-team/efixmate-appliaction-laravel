import { router } from '@inertiajs/vue3';

const envBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_V1_API_BASE_URL;
export const API_BASE_URL = (envBase || '/api').replace(/\/+$/, '');

// Bearer token bridging this outer app's admin session to the separate v1 API
// (see AdminLoginController + HandleInertiaRequests) — read fresh on every
// request since `router.page` updates across Inertia navigations without a reload.
function v1AuthHeader() {
    const token = router.page?.props?.auth?.v1ApiToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function urlFor(endpoint, params = null) {
    const path = `/${String(endpoint || '').replace(/^\/+/, '')}`;
    const url = `${API_BASE_URL}${path}`;
    if (!params || Object.keys(params).length === 0) return url;
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') search.set(key, value);
    });
    const query = search.toString();
    return query ? `${url}?${query}` : url;
}

async function parseResponse(response) {
    let body = null;
    try {
        body = await response.json();
    } catch {
        body = { message: response.statusText || `HTTP ${response.status}` };
    }
    if (!response.ok && body && typeof body === 'object' && body.status === undefined) {
        body.status = false;
    }
    return body;
}

export async function apiRequest(endpoint, { method = 'GET', data = null, params = null } = {}) {
    try {
        const response = await fetch(urlFor(endpoint, method === 'GET' ? params : null), {
            method,
            credentials: 'include',
            headers: {
                ...(data instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
                ...v1AuthHeader(),
            },
            body: data == null ? undefined : data instanceof FormData ? data : JSON.stringify(data),
        });
        return await parseResponse(response);
    } catch (error) {
        return {
            status: false,
            networkError: true,
            message: error?.message || 'Unable to reach v1 API.',
        };
    }
}

export const adminApi = {
    getDashboardStats: (params) => apiRequest('/admin/dashboard/stats', { params }),
    getRecentBookings: (params) => apiRequest('/admin/dashboard/recent-bookings', { params }),
    getTopServices: (params) => apiRequest('/admin/dashboard/top-services', { params }),
    getDashboardActivity: (params) => apiRequest('/admin/dashboard/activity', { params }),
    getMenuData: () => apiRequest('/admin/menus'),

    // Admin Management — administrators
    register: (data) => apiRequest('/admin/create', { method: 'POST', data }),
    getAdmins: (data) => apiRequest('/admin/admin-paginated', { method: 'POST', data }),
    getAdminById: (data) => apiRequest('/admin/get', { method: 'POST', data }),
    updateAdmin: (data) => apiRequest('/admin/update', { method: 'POST', data }),
    deleteAdmin: (data) => apiRequest('/admin/toggle-status', { method: 'POST', data }),
    resetPassword: (data) => apiRequest('/admin/reset-password', { method: 'POST', data }),

    // Admin Management — roles
    createRole: (data) => apiRequest('/admin/roles-create', { method: 'POST', data }),
    getRoles: (data) => apiRequest('/admin/role-paginated', { method: 'POST', data }),
    updateRole: (data) => apiRequest('/admin/roles-update', { method: 'POST', data }),
    deleteRole: (data) => apiRequest('/admin/roles-delete', { method: 'POST', data }),
    toggleRole: (data) => apiRequest('/admin/roles-toggle', { method: 'POST', data }),
    getRoleDropdown: () => apiRequest('/admin/roles-dropdown'),
    getRolePermissions: (data) => apiRequest('/admin/role-permissions', { method: 'POST', data }),
    toggleRolePermission: (data) => apiRequest('/admin/role-permissions-toggle', { method: 'POST', data }),

    // Admin Management — privileges
    createPrivilege: (data) => apiRequest('/admin/privileges-create', { method: 'POST', data }),
    updatePrivilege: (data) => apiRequest('/admin/privileges-update', { method: 'POST', data }),
    deletePrivilege: (data) => apiRequest('/admin/privileges-delete', { method: 'POST', data }),
    privilegesByMenu: (data) => apiRequest('/admin/privileges-by-menu', { method: 'POST', data }),
    privilegesListWithMenu: () => apiRequest('/admin/privileges-list-with-menu', { method: 'POST', data: {} }),

    // Admin Management — menus
    createMenu: (data) => apiRequest('/admin/create-menus', { method: 'POST', data }),
    updateMenu: (data) => apiRequest('/admin/update-menus', { method: 'POST', data }),
    paginatedMenu: (data) => apiRequest('/admin/menu-paginated', { method: 'POST', data }),
    activateMenu: (data) => apiRequest('/admin/activate-menus', { method: 'POST', data }),
    deactivateMenu: (data) => apiRequest('/admin/deactivate-menus', { method: 'POST', data }),
    bulkActivateMenu: (data) => apiRequest('/admin/bulk-activate-menus', { method: 'POST', data }),
    bulkDeactivateMenu: (data) => apiRequest('/admin/bulk-deactivate-menus', { method: 'POST', data }),
    getMenuParent: () => apiRequest('/admin/get-parents'),
    getMenuGroup: () => apiRequest('/admin/get-groups'),
    deleteMenu: (data) => apiRequest('/admin/delete-menus', { method: 'POST', data }),

    request: apiRequest,
};