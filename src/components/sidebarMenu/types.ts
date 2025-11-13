export interface MenuItem {
  index: string;
  icon: any;
  title: string;
  disabled?: boolean;
  isLower?: boolean; // 标识底部菜单项
}

export interface SidebarMenuProps {
  menuItems: MenuItem[];
  defaultActive?: string;
}

export interface SidebarMenuEmits {
  (e: "select", index: string): void;
  (e: "toggle-collapse"): void;
}
