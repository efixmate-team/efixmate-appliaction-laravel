/**
 * Menu ordering helpers — matches admin Sidebar (group by menu_group_id, sort_order, parent/child tree).
 */

export type SidebarMenuRow = {
  menu_id: number;
  menu_name: string;
  menu_path: string;
  menu_group?: string | null;
  menu_group_id?: number;
  menu_type?: string;
  menu_parent_id?: number | null;
  sort_order?: number;
  children?: SidebarMenuRow[];
};

export type MenuGroupSection = {
  menu_group_id: number;
  menu_group: string;
  menus: SidebarMenuRow[];
};

/** Same tree build as Sidebar.tsx `buildMenuTree`. */
export function buildMenuTree(menus: SidebarMenuRow[]): SidebarMenuRow[] {
  const parents: SidebarMenuRow[] = [];
  const independents: SidebarMenuRow[] = [];
  const childrenMap: Record<number, SidebarMenuRow[]> = {};

  menus.forEach((m) => {
    if (m.menu_type === "C" && m.menu_parent_id != null) {
      if (!childrenMap[m.menu_parent_id]) childrenMap[m.menu_parent_id] = [];
      childrenMap[m.menu_parent_id].push(m);
    } else if (m.menu_type === "P") {
      parents.push(m);
    } else {
      independents.push(m);
    }
  });

  return [...independents, ...parents].map((m) =>
    m.menu_type === "P" ? { ...m, children: childrenMap[m.menu_id] ?? [] } : m
  );
}

/** Flat list in sidebar visual order: independents, then each parent followed by its children. */
export function flattenMenusInSidebarOrder(menus: SidebarMenuRow[]): SidebarMenuRow[] {
  const tree = buildMenuTree(menus);
  const out: SidebarMenuRow[] = [];
  for (const item of tree) {
    if (item.menu_type === "P") {
      out.push(item);
      for (const child of item.children ?? []) out.push(child);
    } else {
      out.push(item);
    }
  }
  return out;
}

/** Groups ordered by menu_group_id; menus within each group follow sidebar sequence. */
export function groupMenusLikeSidebar(menus: SidebarMenuRow[]): MenuGroupSection[] {
  const sorted = [...menus].sort((a, b) => {
    const g = (a.menu_group_id ?? 0) - (b.menu_group_id ?? 0);
    if (g !== 0) return g;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const map = new Map<number, MenuGroupSection>();
  for (const m of sorted) {
    const gid = m.menu_group_id ?? 0;
    if (!map.has(gid)) {
      map.set(gid, {
        menu_group_id: gid,
        menu_group: m.menu_group?.trim() || "Other",
        menus: [],
      });
    }
    map.get(gid)!.menus.push(m);
  }

  return [...map.values()]
    .sort((a, b) => a.menu_group_id - b.menu_group_id)
    .map((g) => ({
      ...g,
      menus: flattenMenusInSidebarOrder(g.menus),
    }));
}
