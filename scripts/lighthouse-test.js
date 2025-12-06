/**
 * Lighthouse 性能测试脚本
 * 测量首屏加载时间 (FCP, LCP) 等关键指标
 *
 * 使用方法:
 * 1. 先启动预览服务器: pnpm preview
 * 2. 运行测试: node scripts/lighthouse-test.js
 *
 * 依赖: npm install -g lighthouse
 *
 * Requirements: 3.2, 3.3
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  url: process.env.TEST_URL || "http://localhost:4173",
  outputDir: path.resolve(__dirname, "../dist"),
  runs: 3, // 运行多次取平均值
};

/**
 * 运行单次 Lighthouse 测试
 */
async function runLighthouse(url, outputPath) {
  // 使用新版 headless 模式，添加更多兼容性参数
  const cmd = `lighthouse ${url} \
    --output=json \
    --output-path=${outputPath} \
    --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" \
    --only-categories=performance \
    --quiet`;

  try {
    await execAsync(cmd, { timeout: 180000 });
    return JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  } catch (error) {
    console.error("Lighthouse 执行失败:", error.message);
    // 尝试不使用 headless 模式
    console.log("   尝试使用非 headless 模式...");
    const fallbackCmd = `lighthouse ${url} \
      --output=json \
      --output-path=${outputPath} \
      --only-categories=performance \
      --quiet`;
    try {
      await execAsync(fallbackCmd, { timeout: 180000 });
      return JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    } catch (fallbackError) {
      console.error("   非 headless 模式也失败:", fallbackError.message);
      return null;
    }
  }
}

/**
 * 提取关键性能指标
 */
function extractMetrics(report) {
  if (!report || !report.audits) return null;

  const audits = report.audits;

  return {
    // 首次内容绘制
    fcp: {
      value: audits["first-contentful-paint"]?.numericValue,
      score: audits["first-contentful-paint"]?.score,
      displayValue: audits["first-contentful-paint"]?.displayValue,
    },
    // 最大内容绘制
    lcp: {
      value: audits["largest-contentful-paint"]?.numericValue,
      score: audits["largest-contentful-paint"]?.score,
      displayValue: audits["largest-contentful-paint"]?.displayValue,
    },
    // 首次输入延迟
    fid: {
      value: audits["max-potential-fid"]?.numericValue,
      score: audits["max-potential-fid"]?.score,
      displayValue: audits["max-potential-fid"]?.displayValue,
    },
    // 累积布局偏移
    cls: {
      value: audits["cumulative-layout-shift"]?.numericValue,
      score: audits["cumulative-layout-shift"]?.score,
      displayValue: audits["cumulative-layout-shift"]?.displayValue,
    },
    // 总阻塞时间
    tbt: {
      value: audits["total-blocking-time"]?.numericValue,
      score: audits["total-blocking-time"]?.score,
      displayValue: audits["total-blocking-time"]?.displayValue,
    },
    // 速度指数
    si: {
      value: audits["speed-index"]?.numericValue,
      score: audits["speed-index"]?.score,
      displayValue: audits["speed-index"]?.displayValue,
    },
    // 总体性能分数
    performanceScore: report.categories?.performance?.score * 100,
  };
}

/**
 * 计算多次运行的平均值
 */
function calculateAverage(metricsArray) {
  const validMetrics = metricsArray.filter((m) => m !== null);
  if (validMetrics.length === 0) return null;

  const avg = {};
  const keys = Object.keys(validMetrics[0]);

  keys.forEach((key) => {
    if (key === "performanceScore") {
      avg[key] =
        validMetrics.reduce((sum, m) => sum + (m[key] || 0), 0) /
        validMetrics.length;
    } else {
      avg[key] = {
        value:
          validMetrics.reduce((sum, m) => sum + (m[key]?.value || 0), 0) /
          validMetrics.length,
        score:
          validMetrics.reduce((sum, m) => sum + (m[key]?.score || 0), 0) /
          validMetrics.length,
      };
    }
  });

  return avg;
}

/**
 * 格式化时间
 */
function formatTime(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * 打印性能报告
 */
function printReport(metrics, label = "性能测试结果") {
  console.log(`\n📊 ${label}`);
  console.log("═".repeat(60));

  if (!metrics) {
    console.log("❌ 无法获取性能指标");
    return;
  }

  console.log(
    `\n🎯 总体性能分数: ${metrics.performanceScore?.toFixed(0) || "N/A"}/100\n`,
  );

  console.log("核心 Web 指标:");
  console.log("─".repeat(60));
  console.log(
    `  FCP (首次内容绘制):     ${formatTime(metrics.fcp?.value || 0).padStart(10)}`,
  );
  console.log(
    `  LCP (最大内容绘制):     ${formatTime(metrics.lcp?.value || 0).padStart(10)}`,
  );
  console.log(
    `  TBT (总阻塞时间):       ${formatTime(metrics.tbt?.value || 0).padStart(10)}`,
  );
  console.log(
    `  CLS (累积布局偏移):     ${(metrics.cls?.value || 0).toFixed(3).padStart(10)}`,
  );
  console.log(
    `  SI  (速度指数):         ${formatTime(metrics.si?.value || 0).padStart(10)}`,
  );

  console.log("═".repeat(60));
}

/**
 * 保存测试结果
 */
function saveResults(metrics, filename) {
  const outputPath = path.join(CONFIG.outputDir, filename);
  const result = {
    timestamp: new Date().toISOString(),
    url: CONFIG.url,
    runs: CONFIG.runs,
    metrics,
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n📄 结果已保存: ${outputPath}`);
}

/**
 * 对比两次测试结果
 */
function compareResults(before, after) {
  console.log("\n📈 性能对比分析");
  console.log("═".repeat(60));

  const metrics = ["fcp", "lcp", "tbt", "si"];
  const labels = {
    fcp: "FCP (首次内容绘制)",
    lcp: "LCP (最大内容绘制)",
    tbt: "TBT (总阻塞时间)",
    si: "SI  (速度指数)",
  };

  metrics.forEach((key) => {
    const beforeVal = before[key]?.value || 0;
    const afterVal = after[key]?.value || 0;
    const diff = beforeVal - afterVal;
    const percent = beforeVal > 0 ? ((diff / beforeVal) * 100).toFixed(1) : 0;
    const improved = diff > 0;

    console.log(`  ${labels[key]}:`);
    console.log(`    优化前: ${formatTime(beforeVal)}`);
    console.log(`    优化后: ${formatTime(afterVal)}`);
    console.log(
      `    ${improved ? "✅ 提升" : "⚠️ 变化"}: ${Math.abs(percent)}%\n`,
    );
  });

  // 性能分数对比
  const scoreDiff =
    (after.performanceScore || 0) - (before.performanceScore || 0);
  console.log(`  总体性能分数:`);
  console.log(`    优化前: ${before.performanceScore?.toFixed(0) || "N/A"}`);
  console.log(`    优化后: ${after.performanceScore?.toFixed(0) || "N/A"}`);
  console.log(
    `    ${scoreDiff > 0 ? "✅ 提升" : "⚠️ 变化"}: ${Math.abs(scoreDiff).toFixed(0)} 分`,
  );

  console.log("═".repeat(60));
}

async function main() {
  const args = process.argv.slice(2);
  const isCompare = args.includes("--compare");
  const isBefore = args.includes("--before");
  const isAfter = args.includes("--after");

  console.log("🚀 Lighthouse 性能测试");
  console.log(`📍 测试 URL: ${CONFIG.url}`);
  console.log(`🔄 运行次数: ${CONFIG.runs}`);

  // 检查 lighthouse 是否安装
  try {
    await execAsync("lighthouse --version");
  } catch {
    console.error("\n❌ 请先安装 Lighthouse: npm install -g lighthouse");
    process.exit(1);
  }

  if (isCompare) {
    // 对比模式：读取之前保存的结果
    const beforePath = path.join(CONFIG.outputDir, "perf-before.json");
    const afterPath = path.join(CONFIG.outputDir, "perf-after.json");

    if (!fs.existsSync(beforePath) || !fs.existsSync(afterPath)) {
      console.error("\n❌ 请先运行 --before 和 --after 测试");
      console.log("   node scripts/lighthouse-test.js --before  # 优化前");
      console.log("   node scripts/lighthouse-test.js --after   # 优化后");
      process.exit(1);
    }

    const before = JSON.parse(fs.readFileSync(beforePath, "utf-8"));
    const after = JSON.parse(fs.readFileSync(afterPath, "utf-8"));

    compareResults(before.metrics, after.metrics);
    return;
  }

  // 运行测试
  const allMetrics = [];

  for (let i = 1; i <= CONFIG.runs; i++) {
    console.log(`\n⏳ 运行测试 ${i}/${CONFIG.runs}...`);
    const outputPath = path.join(CONFIG.outputDir, `lighthouse-run-${i}.json`);
    const report = await runLighthouse(CONFIG.url, outputPath);
    const metrics = extractMetrics(report);
    allMetrics.push(metrics);

    if (metrics) {
      console.log(
        `   FCP: ${formatTime(metrics.fcp?.value || 0)}, LCP: ${formatTime(metrics.lcp?.value || 0)}`,
      );
    }
  }

  const avgMetrics = calculateAverage(allMetrics);
  printReport(avgMetrics, `平均性能指标 (${CONFIG.runs} 次运行)`);

  // 保存结果
  if (isBefore) {
    saveResults(avgMetrics, "perf-before.json");
    console.log(
      "\n💡 提示: 优化后运行 node scripts/lighthouse-test.js --after",
    );
  } else if (isAfter) {
    saveResults(avgMetrics, "perf-after.json");
    console.log(
      "\n💡 提示: 运行 node scripts/lighthouse-test.js --compare 查看对比",
    );
  } else {
    saveResults(avgMetrics, "perf-latest.json");
  }
}

main().catch(console.error);
