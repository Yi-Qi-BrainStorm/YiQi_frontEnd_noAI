<template>
  <div class="virtual-table-container" :style="{ height: containerHeight }">
    <!-- 表头 -->
    <div
      v-if="showHeader"
      class="virtual-table-header"
      :class="{ 'has-border': border }"
    >
      <div class="virtual-table-row header-row">
        <div
          v-for="column in columns"
          :key="String(column.prop)"
          class="virtual-table-cell"
          :style="getCellStyle(column)"
          :class="[
            `align-${column.align || 'left'}`,
            column.fixed ? `fixed-${column.fixed}` : '',
          ]"
        >
          {{ column.label }}
        </div>
        <div
          v-if="actions && actions.length > 0"
          class="virtual-table-cell action-cell"
          :style="{ width: actionWidth }"
        >
          操作
        </div>
      </div>
    </div>

    <!-- 表格主体（虚拟滚动） -->
    <div
      ref="scrollContainer"
      class="virtual-table-body"
      :class="{ 'has-border': border }"
      :style="{ height: bodyHeight }"
      @scroll="handleScroll"
    >
      <div class="virtual-table-spacer" :style="{ height: `${totalHeight}px` }">
        <div
          class="virtual-table-content"
          :style="{ transform: `translateY(${offsetY}px)` }"
        >
          <!-- 空数据提示 -->
          <div v-if="data.length === 0 && !loading" class="empty-data">
            {{ emptyText }}
          </div>

          <!-- 加载中 -->
          <div v-if="loading" class="loading-data">
            <el-icon class="is-loading">
              <Loading />
            </el-icon>
            <span>加载中...</span>
          </div>

          <!-- 数据行 -->
          <div
            v-for="(row, index) in visibleData"
            :key="getRowKey(row, index)"
            class="virtual-table-row"
            :class="{
              'stripe-row': stripe && (startIndex + index) % 2 === 1,
              'highlight-row':
                highlightCurrentRow && currentRowIndex === startIndex + index,
            }"
            :style="{ height: `${itemHeight}px` }"
            @click="handleRowClick(row, startIndex + index)"
          >
            <div
              v-for="column in columns"
              :key="String(column.prop)"
              class="virtual-table-cell"
              :style="getCellStyle(column)"
              :class="[
                `align-${column.align || 'left'}`,
                column.fixed ? `fixed-${column.fixed}` : '',
              ]"
            >
              <!-- 自定义插槽 -->
              <slot
                v-if="column.slot"
                :name="column.slot"
                :row="row"
                :column="column"
                :index="startIndex + index"
              >
                {{ getCellValue(row, column) }}
              </slot>
              <!-- 默认显示 -->
              <span v-else>{{ formatCellValue(row, column) }}</span>
            </div>

            <!-- 操作列 -->
            <div
              v-if="actions && actions.length > 0"
              class="virtual-table-cell action-cell"
              :style="{ width: actionWidth }"
            >
              <div class="action-buttons">
                <el-button
                  v-for="(action, actionIndex) in getVisibleActions(row)"
                  :key="actionIndex"
                  :type="action.type || 'text'"
                  :icon="action.icon"
                  :disabled="action.disabled ? action.disabled(row) : false"
                  size="small"
                  @click.stop="action.onClick(row, startIndex + index)"
                >
                  {{ action.label }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup generic="T extends Record<string, any>">
import { ref, computed, watch } from "vue";
import { Loading } from "@element-plus/icons-vue";
import type {
  VirtualTableColumn,
  VirtualTableAction,
} from "@/types/components/virtualTable";

// Props
interface Props {
  data: T[];
  columns: VirtualTableColumn<T>[];
  actions?: VirtualTableAction<T>[];
  height?: number | string;
  itemHeight?: number;
  loading?: boolean;
  emptyText?: string;
  stripe?: boolean;
  border?: boolean;
  showHeader?: boolean;
  highlightCurrentRow?: boolean;
  rowKey?: string | ((row: T) => string);
}

const props = withDefaults(defineProps<Props>(), {
  height: "100%",
  itemHeight: 50,
  loading: false,
  emptyText: "暂无数据",
  stripe: true,
  border: true,
  showHeader: true,
  highlightCurrentRow: false,
  rowKey: "id",
});

// Emits
const emit = defineEmits<{
  (e: "row-click", row: T, index: number): void;
}>();

// 响应式数据
const scrollContainer = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const currentRowIndex = ref(-1);

// 计算属性
const containerHeight = computed(() => {
  return typeof props.height === "number" ? `${props.height}px` : props.height;
});

const bodyHeight = computed(() => {
  if (props.showHeader) {
    return "calc(100% - 50px)";
  }
  return "100%";
});

const totalHeight = computed(() => {
  return props.data.length * props.itemHeight;
});

const visibleCount = computed(() => {
  if (!scrollContainer.value) return 10;
  const containerHeight = scrollContainer.value.clientHeight;
  return Math.ceil(containerHeight / props.itemHeight) + 2; // 多渲染2行作为缓冲
});

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - 1);
});

const endIndex = computed(() => {
  return Math.min(props.data.length, startIndex.value + visibleCount.value);
});

const visibleData = computed(() => {
  return props.data.slice(startIndex.value, endIndex.value);
});

const offsetY = computed(() => {
  return startIndex.value * props.itemHeight;
});

const actionWidth = computed(() => {
  if (!props.actions || props.actions.length === 0) return "0px";
  return `${props.actions.length * 80 + 20}px`; // 每个按钮约80px，加上padding
});

// 方法
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
};

const handleRowClick = (row: T, index: number) => {
  currentRowIndex.value = index;
  emit("row-click", row, index);
};

const getCellStyle = (column: VirtualTableColumn<T>) => {
  const style: Record<string, string> = {};
  if (column.width) {
    style.width =
      typeof column.width === "number" ? `${column.width}px` : column.width;
    style.flexShrink = "0";
  }
  if (column.minWidth) {
    style.minWidth =
      typeof column.minWidth === "number"
        ? `${column.minWidth}px`
        : column.minWidth;
  }
  return style;
};

const getCellValue = (row: T, column: VirtualTableColumn<T>) => {
  const prop = column.prop as string;
  return prop.split(".").reduce((obj, key) => obj?.[key], row as any);
};

const formatCellValue = (row: T, column: VirtualTableColumn<T>) => {
  const value = getCellValue(row, column);
  if (column.formatter) {
    return column.formatter(row, column, value);
  }
  return value ?? "-";
};

const getVisibleActions = (row: T) => {
  if (!props.actions) return [];
  return props.actions.filter((action) => {
    return action.show ? action.show(row) : true;
  });
};

const getRowKey = (row: T, index: number): string => {
  if (typeof props.rowKey === "function") {
    return props.rowKey(row);
  }
  return row[props.rowKey] ?? index;
};

// 监听数据变化，重置滚动位置
watch(
  () => props.data,
  () => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0;
      scrollTop.value = 0;
    }
  },
);
</script>

<style lang="scss" scoped>
.virtual-table-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border-radius: 4px;
}

.virtual-table-header {
  flex-shrink: 0;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;

  &.has-border {
    border: 1px solid #ebeef5;
    border-bottom: none;
  }

  .header-row {
    font-weight: 600;
    color: #909399;
  }
}

.virtual-table-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;

  &.has-border {
    border: 1px solid #ebeef5;
  }

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 4px;

    &:hover {
      background: #c0c4cc;
    }
  }
}

.virtual-table-spacer {
  position: relative;
  width: 100%;
}

.virtual-table-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-table-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f7fa;
  }

  &.stripe-row {
    background-color: #fafafa;

    &:hover {
      background-color: #f5f7fa;
    }
  }

  &.highlight-row {
    background-color: #ecf5ff;

    &:hover {
      background-color: #d9ecff;
    }
  }
}

.virtual-table-cell {
  flex: 1;
  padding: 12px 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #606266;

  &.align-left {
    text-align: left;
  }

  &.align-center {
    text-align: center;
  }

  &.align-right {
    text-align: right;
  }

  &.action-cell {
    flex: 0 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}

.empty-data,
.loading-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #909399;
  font-size: 14px;

  .el-icon {
    font-size: 24px;
    margin-bottom: 12px;
  }
}
</style>
