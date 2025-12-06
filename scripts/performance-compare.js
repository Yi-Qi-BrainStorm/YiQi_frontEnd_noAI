/**
 * 构建产物分析脚本
 * 分析 dist 目录中的 chunk 文件大小和 gzip 压缩后大小
 *
 * 使用方法: node scripts/performance-compare.js
 *
 * Requirements: 3.1 - 记录优化前后的 chunk 数量和大小
 */

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CHUNK_SIZE_LIMIT_KB = 500; // chunk 大小限制 (KB)
const DIST_PATH = path.resolve(__dirname, "../dist");

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小字符串
 */
function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

/**
 * 分析单个文件
 * @param {string} filePath - 文件路径
 * @returns {Object} 文件分析结果
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content);

  return {
    name: path.basename(filePath),
    size: content.length,
    gzipSize: gzipped.length,
  };
}

/**
 * 分析构建产物
 * @param {string} distPath - dist 目录路径
 * @returns {Object} 分析结果
 */
function analyzeChunks(distPath) {
  const assetsPath = path.join(distPath, "assets");

  // 检查 dist 目录是否存在
  if (!fs.existsSync(distPath)) {
    console.error("❌ 错误: dist 目录不存在，请先运行 pnpm build");
    process.exit(1);
  }

  // 检查 assets 目录是否存在
  if (!fs.existsSync(assetsPath)) {
    console.error("❌ 错误: dist/assets 目录不存在");
    process.exit(1);
  }

  const files = fs.readdirSync(assetsPath);

  // 分析 JS 文件
  const jsFiles = files.filter((f) => f.endsWith(".js"));
  const jsResults = jsFiles.map((file) =>
    analyzeFile(path.join(assetsPath, file)),
  );

  // 分析 CSS 文件
  const cssFiles = files.filter((f) => f.endsWith(".css"));
  const cssResults = cssFiles.map((file) =>
    analyzeFile(path.join(assetsPath, file)),
  );

  return {
    js: jsResults,
    css: cssResults,
    totalJs: jsResults.reduce((sum, r) => sum + r.gzipSize, 0),
    totalCss: cssResults.reduce((sum, r) => sum + r.gzipSize, 0),
  };
}

/**
 * 打印分析报告
 * @param {Object} analysis - 分析结果
 */
function printReport(analysis) {
  const { js, css, totalJs, totalCss } = analysis;

  console.log("\n📊 构建产物分析报告");
  console.log("═".repeat(70));

  // JS 文件分析
  console.log("\n📦 JavaScript Chunks:");
  console.log("─".repeat(70));
  console.log(
    "Chunk 名称".padEnd(45) +
      "原始大小".padStart(12) +
      "Gzip 大小".padStart(12),
  );
  console.log("─".repeat(70));

  // 按 gzip 大小排序
  const sortedJs = [...js].sort((a, b) => b.gzipSize - a.gzipSize);

  sortedJs.forEach((r) => {
    const oversized = r.gzipSize > CHUNK_SIZE_LIMIT_KB * 1024;
    const prefix = oversized ? "⚠️ " : "   ";
    console.log(
      prefix +
        r.name.padEnd(42) +
        formatSize(r.size).padStart(12) +
        formatSize(r.gzipSize).padStart(12),
    );
  });

  console.log("─".repeat(70));
  console.log(
    `   JS 总计 (${js.length} 个文件)`.padEnd(45) +
      "".padStart(12) +
      formatSize(totalJs).padStart(12),
  );

  // CSS 文件分析
  if (css.length > 0) {
    console.log("\n🎨 CSS 文件:");
    console.log("─".repeat(70));

    css.forEach((r) => {
      console.log(
        "   " +
          r.name.padEnd(42) +
          formatSize(r.size).padStart(12) +
          formatSize(r.gzipSize).padStart(12),
      );
    });

    console.log("─".repeat(70));
    console.log(
      `   CSS 总计 (${css.length} 个文件)`.padEnd(45) +
        "".padStart(12) +
        formatSize(totalCss).padStart(12),
    );
  }

  // 总计
  console.log("\n═".repeat(70));
  console.log(`📈 总计 (Gzip): ${formatSize(totalJs + totalCss)}`);
  console.log("═".repeat(70));

  // 检查超过限制的 chunk
  const oversizedChunks = js.filter(
    (r) => r.gzipSize > CHUNK_SIZE_LIMIT_KB * 1024,
  );
  if (oversizedChunks.length > 0) {
    console.log(
      `\n⚠️  警告: 以下 ${oversizedChunks.length} 个 chunk 超过 ${CHUNK_SIZE_LIMIT_KB}KB 限制:`,
    );
    oversizedChunks.forEach((r) => {
      console.log(`   - ${r.name}: ${formatSize(r.gzipSize)}`);
    });
  } else {
    console.log(`\n✅ 所有 chunk 均在 ${CHUNK_SIZE_LIMIT_KB}KB 限制内`);
  }

  // 分块策略分析
  console.log("\n📋 分块策略分析:");
  console.log("─".repeat(70));

  const elementUiChunk = js.find((r) => r.name.includes("element-ui"));
  const vueVendorChunk = js.find((r) => r.name.includes("vue-vendor"));
  const vendorChunk = js.find(
    (r) => r.name.includes("vendor") && !r.name.includes("vue-vendor"),
  );

  if (elementUiChunk) {
    console.log(
      `   ✅ Element Plus 独立打包: ${formatSize(elementUiChunk.gzipSize)}`,
    );
  } else {
    console.log("   ❌ Element Plus 未独立打包");
  }

  if (vueVendorChunk) {
    console.log(
      `   ✅ Vue 核心库独立打包: ${formatSize(vueVendorChunk.gzipSize)}`,
    );
  } else {
    console.log("   ❌ Vue 核心库未独立打包");
  }

  if (vendorChunk) {
    console.log(
      `   ✅ 其他第三方库独立打包: ${formatSize(vendorChunk.gzipSize)}`,
    );
  } else {
    console.log("   ❌ 其他第三方库未独立打包");
  }

  console.log("\n");

  return {
    js,
    css,
    totalJs,
    totalCss,
    oversizedChunks,
  };
}

/**
 * 导出 JSON 报告
 * @param {Object} analysis - 分析结果
 * @param {string} outputPath - 输出路径
 */
function exportJsonReport(analysis, outputPath) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      jsChunks: analysis.js.length,
      cssFiles: analysis.css.length,
      totalJsSize: analysis.totalJs,
      totalCssSize: analysis.totalCss,
      totalSize: analysis.totalJs + analysis.totalCss,
      oversizedChunks: analysis.oversizedChunks?.length || 0,
    },
    chunks: {
      js: analysis.js.map((r) => ({
        name: r.name,
        size: r.size,
        gzipSize: r.gzipSize,
        oversized: r.gzipSize > CHUNK_SIZE_LIMIT_KB * 1024,
      })),
      css: analysis.css.map((r) => ({
        name: r.name,
        size: r.size,
        gzipSize: r.gzipSize,
      })),
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`📄 JSON 报告已导出: ${outputPath}`);
}

// 主函数
function main() {
  console.log("🔍 开始分析构建产物...");

  const analysis = analyzeChunks(DIST_PATH);
  const result = printReport(analysis);

  // 检查是否需要导出 JSON 报告
  if (process.argv.includes("--json")) {
    const jsonPath = path.join(DIST_PATH, "build-analysis.json");
    exportJsonReport(
      { ...analysis, oversizedChunks: result.oversizedChunks },
      jsonPath,
    );
  }

  // 如果有超过限制的 chunk，返回非零退出码
  if (result.oversizedChunks.length > 0) {
    process.exit(1);
  }
}

main();
