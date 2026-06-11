// Chart — the dispatcher. Takes a parsed-and-validated ChartSpec (from coerceChartSpec) and renders
// the matching primitive. Unknown/unsupported types fall back gracefully to nothing — a chart the
// renderer doesn't understand simply doesn't appear, never an error in the chat. RichMessage owns
// the parse/coerce step (so an incomplete mid-stream block renders nothing); this component only
// ever sees a valid spec.
import type { ChartSpec } from './types.js';
import { BarChart } from './BarChart.js';
import { ComparisonChart } from './ComparisonChart.js';
import { MetricChart } from './MetricChart.js';
import { ProgressChart } from './ProgressChart.js';

export function Chart({ spec }: { spec: ChartSpec }) {
  switch (spec.type) {
    case 'bar':
      return <BarChart spec={spec} />;
    case 'comparison':
      return <ComparisonChart spec={spec} />;
    case 'metric':
      return <MetricChart spec={spec} />;
    case 'progress':
      return <ProgressChart spec={spec} />;
    default:
      // Exhaustive in practice (coerceChartSpec only emits the four), but stay graceful for any
      // future/unknown shape rather than throwing inside a streamed message.
      return null;
  }
}
