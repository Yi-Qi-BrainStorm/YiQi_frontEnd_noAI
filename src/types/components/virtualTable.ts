// 虚拟表格列配置
export interface VirtualTableColumn<T = any> {
  prop: keyof T | string; // 数据字段名
  label: string; // 列标题
  width?: number | string; // 列宽度
  minWidth?: number | string; // 最小宽度
  align?: "left" | "center" | "right"; // 对齐方式
  fixed?: "left" | "right"; // 固定列
  sortable?: boolean; // 是否可排序
  formatter?: (row: T, column: VirtualTableColumn<T>, cellValue: any) => string; // 格式化函数
  slot?: string; // 自定义插槽名称
}

// 虚拟表格操作按钮配置
export interface VirtualTableAction<T = any> {
  label: string; // 按钮文本
  type?: "primary" | "success" | "warning" | "danger" | "info" | "text"; // 按钮类型
  icon?: string; // 图标
  onClick: (row: T, index: number) => void; // 点击事件
  show?: (row: T) => boolean; // 是否显示（可选）
  disabled?: (row: T) => boolean; // 是否禁用（可选）
}

// 虚拟表格配置
export interface VirtualTableProps<T = any> {
  data: T[]; // 表格数据
  columns: VirtualTableColumn<T>[]; // 列配置
  actions?: VirtualTableAction<T>[]; // 操作列配置
  height?: number | string; // 表格高度
  itemHeight?: number; // 每行高度（用于虚拟滚动计算）
  loading?: boolean; // 加载状态
  emptyText?: string; // 空数据提示
  stripe?: boolean; // 是否斑马纹
  border?: boolean; // 是否显示边框
  showHeader?: boolean; // 是否显示表头
  highlightCurrentRow?: boolean; // 是否高亮当前行
}

// 虚拟表格事件
export interface VirtualTableEmits<T = any> {
  (e: "row-click", row: T, index: number): void;
  (e: "selection-change", selection: T[]): void;
  (
    e: "sort-change",
    prop: string,
    order: "ascending" | "descending" | null,
  ): void;
}
