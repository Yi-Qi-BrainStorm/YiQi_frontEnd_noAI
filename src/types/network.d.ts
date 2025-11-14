/**
 * 声明 NetworkInformation 接口，该接口包含 connection 对象的属性
 * 属性可能因浏览器而异，这里给出常见的几个
 */
interface NetworkInformation extends EventTarget {
  // 只读属性，例如 '4g', '3g', '2g', 'slow-2g', 'wifi', 'ethernet', 'unknown'
  readonly effectiveType: "2g" | "3g" | "4g" | "slow-2g" | string;

  // 只读属性，估计的往返时间（毫秒）
  readonly rtt: number;

  // 只读属性，带宽估计值（兆比特/秒）
  readonly downlink: number;

  // 只读属性，最大下行带宽（兆比特/秒）
  readonly downlinkMax: number;

  // 可选：添加事件处理
  onchange?: EventListener;
}

/**
 * 扩展全局 Navigator 接口
 * 将 connection 属性添加到 Navigator 上
 */
interface Navigator {
  readonly connection?: NetworkInformation;
  readonly mozConnection?: NetworkInformation; // Firefox 兼容
  readonly webkitConnection?: NetworkInformation; // 旧 WebKit 兼容
}
