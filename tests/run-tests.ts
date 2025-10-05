/**
 * Test runner - executes all algorithm tests and generates reports
 */

import { runTests } from './algorithm-simulator';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Redirect console output to both console and file
class Logger {
  private logs: string[] = [];
  private originalLog!: typeof console.log;
  private originalError!: typeof console.error;

  start() {
    this.originalLog = console.log;
    this.originalError = console.error;

    console.log = (...args: unknown[]) => {
      const message = args.join(' ');
      this.logs.push(message);
      this.originalLog(message);
    };

    console.error = (...args: unknown[]) => {
      const message = 'ERROR: ' + args.join(' ');
      this.logs.push(message);
      this.originalError(message);
    };
  }

  stop() {
    console.log = this.originalLog;
    console.error = this.originalError;
  }

  save(filename: string) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const outputPath = path.join(__dirname, `${filename}_${timestamp}.log`);
    fs.writeFileSync(outputPath, this.logs.join('\n'), 'utf8');
    this.originalLog(`\n✅ Test logs saved to: ${outputPath}`);
  }

  getLogs(): string {
    return this.logs.join('\n');
  }
}

// Main test execution
async function main() {
  const logger = new Logger();
  logger.start();

  console.log('🚀 Starting Eukairo Algorithm Test Suite');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Run all tests
    runTests();

    // Save results
    logger.stop();
    logger.save('algorithm-test-results');

    // Generate markdown report
    generateMarkdownReport(logger.getLogs());

  } catch (error) {
    console.error('Test execution failed:', error);
    logger.stop();
    logger.save('algorithm-test-results-ERROR');
    process.exit(1);
  }
}

function generateMarkdownReport(logs: string) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const reportPath = path.join(__dirname, `TEST_REPORT_${timestamp}.md`);

  const markdown = `# 🧪 Eukairo Algorithm Test Report

**Generated**: ${new Date().toLocaleString()}

---

## Test Execution Log

\`\`\`
${logs}
\`\`\`

---

## Quick Summary

This test suite validates the Eukairo recommendation algorithm across 6 scenarios:

1. **Clear Winner** - One protocol significantly better
2. **Close Competition** - Two protocols nearly equal
3. **Time-of-Day Variation** - Effectiveness varies by hour
4. **High Noise User** - Inconsistent ratings
5. **Drift Detection** - Preferences change mid-test
6. **Flat Landscape** - All protocols similar

### Key Metrics Tracked

- **Selection Distribution**: How often each protocol was chosen
- **Learned Scores**: EMA vs actual true scores
- **Convergence Rate**: % of last 50 sessions on best protocol
- **Total Regret**: Cumulative missed reward
- **First Best Found**: Session number when best protocol discovered

### Algorithm Components Tested

✅ ε-greedy exploration (adaptive decay)
✅ EMA for recency weighting (α=0.2)
✅ UCB exploration bonus
✅ Adaptive MED step size (10s/15s/20s)
✅ Contextual scoring (hour-of-day)

---

## How to Interpret Results

**Grade A/A+**: Algorithm converges >70% to best protocol, low regret
**Grade B**: Good convergence (60-70%), moderate regret
**Grade C/D**: Slower convergence, higher regret
**Grade F**: Failed to identify best protocol

**Convergence Rate**: Target is >70% in last 50 sessions
**Average Regret**: Target is <0.15 per session

---

## Next Steps

Review recommendations section for algorithm improvements and innovation ideas.

Consider implementing:
- Thompson Sampling for better uncertainty quantification
- Enhanced contextual features (day-of-week, user state)
- Structured cold-start exploration
- Protocol combination testing
`;

  fs.writeFileSync(reportPath, markdown, 'utf8');
  console.log(`✅ Markdown report saved to: ${reportPath}`);
}

// Run tests
main();
