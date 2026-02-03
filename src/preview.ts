// Type definitions
interface CanvasPoint {
  time: number;
  value: number;
}

interface CanvasCoordinates {
  x: number;
  y: number;
}

export interface AnimationPreviewLine {
  id: string;
  color: string;
  strength: number;
}

export interface AnimationPreviewOptions {
  lines: AnimationPreviewLine[];

  onTargetChange: (from: number, to: number) => void;

  onLineValue: (lineId: string) => number;
}

export class AnimationPreview {
  private readonly options: AnimationPreviewOptions;

  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly graph: HTMLElement;

  // Graph properties
  private readonly startTime: number;
  private width: number = 0;
  private height: number = 0;
  private timeframe: number = 10; // seconds visible on graph

  // Animation state
  private instantValue: number = 0.5; // normalized (0-1)

  // Mouse interaction state
  private isDragging: boolean = false;

  // Data storage for drawing continuous lines
  private instantPoints: CanvasPoint[] = [];
  private linePoints: Record<string, CanvasPoint[]> = {};

  constructor(options: AnimationPreviewOptions) {
    this.options = options;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const graph = document.getElementById("graph") as HTMLElement;

    this.canvas = canvas;
    this.graph = graph;

    const ctx = this.canvas.getContext("2d")!;

    this.ctx = ctx;

    this.options.lines.forEach(({ id }) => {
      this.linePoints[id] = [];
    });

    // Initialize canvas size
    this.resizeCanvas();

    // Graph properties
    this.startTime = performance.now();

    this.setupEventListeners();
    this.animate();
  }

  private resizeCanvas(): void {
    const rect = this.graph.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set display size (CSS pixels)
    this.canvas.style.width = rect.width + "px";
    this.canvas.style.height = rect.height + "px";

    // Set actual size in memory (scaled for DPI)
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Scale the context to ensure correct drawing operations
    this.ctx.scale(dpr, dpr);

    // Update dimensions for calculations
    this.width = rect.width;
    this.height = rect.height;
  }

  private setupEventListeners(): void {
    // Window resize handler
    window.addEventListener("resize", () => {
      this.resizeCanvas();
    });

    // Mouse events for click and drag
    this.graph.addEventListener("mousedown", (e: MouseEvent) => {
      this.handleMouseDown(e);
    });

    this.graph.addEventListener("mousemove", (e: MouseEvent) => {
      if (this.isDragging) {
        this.handleMouseMove(e);
      }
    });

    document.addEventListener("mouseup", () => {
      this.handleMouseUp();
    });

    // Prevent context menu on right click
    this.graph.addEventListener("contextmenu", (e: MouseEvent) => {
      e.preventDefault();
    });

    // Timeframe slider
    const timeframeSlider = document.getElementById(
      "timeframe",
    ) as HTMLInputElement;
    const timeframeValue = document.getElementById(
      "timeframeValue",
    ) as HTMLSpanElement;

    if (timeframeSlider && timeframeValue) {
      timeframeSlider.addEventListener("input", (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.timeframe = parseInt(target.value);
        timeframeValue.textContent = this.timeframe + "s";
      });
    }
  }

  private getCanvasCoordinates(e: MouseEvent): CanvasCoordinates {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private handleMouseDown(e: MouseEvent): void {
    const coords = this.getCanvasCoordinates(e);

    this.isDragging = true;
    this.graph.classList.add("dragging");

    // Handle the initial click
    this.handleValueChange(coords.y);

    // Prevent text selection
    e.preventDefault();
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const coords = this.getCanvasCoordinates(e);

    // Only trigger change if mouse is within graph bounds
    if (coords.y >= 0 && coords.y <= this.height) {
      this.handleValueChange(coords.y);
    }
  }

  private handleMouseUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.graph.classList.remove("dragging");
    }
  }

  private handleValueChange(y: number): void {
    const from = this.instantValue;
    // Convert Y to normalized value (0-1)
    const to = Math.max(0, Math.min(1, 1 - y / this.height));
    // Update instant value immediately

    this.options.onTargetChange(from, to);
    this.instantValue = to;
  }

  private updateAnimation(): void {
    const currentTime = performance.now() - this.startTime;

    // Store data points for continuous lines
    this.instantPoints.push({
      time: currentTime,
      value: this.instantValue,
    });

    Object.entries(this.linePoints).forEach(([line, points]) => {
      points.push({
        time: currentTime,
        value: this.options.onLineValue(line),
      });
    });

    // Keep only points within visible time range
    const visibleTimeRange = this.timeframe * 1000; // Convert to milliseconds
    const cutoffTime = currentTime - visibleTimeRange;

    this.instantPoints = this.instantPoints.filter((p) => p.time > cutoffTime);
    Object.entries(this.linePoints).forEach(([line, points]) => {
      this.linePoints[line] = points.filter((p) => p.time > cutoffTime);
    });
  }

  private draw(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw grid
    this.drawGrid();

    // Draw lines
    this.drawLine(this.instantPoints, "#888", 2); // Gray for instant

    Object.entries(this.linePoints).forEach(([line, points]) => {
      const previewLine = this.options.lines.find(({ id }) => id === line);
      if (!previewLine) {
        return;
      }

      this.drawLine(points, previewLine.color, previewLine.strength);
    });

    // this.drawLine(this.animatedPoints, "#ff4444", 2); // Red for animated
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = "#eee";
    this.ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * this.height;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    // Vertical grid lines - based on timeframe
    const numVerticalLines = 20;
    for (let i = 0; i <= numVerticalLines; i++) {
      const x = (i / numVerticalLines) * this.width;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
  }

  private drawLine(
    points: CanvasPoint[],
    color: string,
    lineWidth: number,
  ): void {
    if (points.length < 2) return;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();

    const currentTime = performance.now() - this.startTime;
    const visibleTimeRange = this.timeframe * 1000; // milliseconds
    const centerTime = currentTime; // Current time is at center
    const startTime = centerTime - visibleTimeRange / 2; // Half timeframe before center
    const timeScale = this.width / visibleTimeRange;

    let hasDrawn = false;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const x = (point.time - startTime) * timeScale;
      const y = this.height * (1 - point.value);

      // Only draw points within visible range
      if (x >= 0 && x <= this.width) {
        if (!hasDrawn) {
          this.ctx.moveTo(x, y);
          hasDrawn = true;
        } else {
          this.ctx.lineTo(x, y);
        }
      }
    }

    if (hasDrawn) {
      this.ctx.stroke();
    }
  }

  private animate(): void {
    this.updateAnimation();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

/*
function clearGraph(): void {
  // Reinitialize the animation preview
  window.animationPreview = new AnimationPreview({
    onTargetChange(from, to) {
      console.log({ from, to });
    },
  });
}

// Initialize when page loads
window.addEventListener("load", () => {
  window.animationPreview = new AnimationPreview({
    onTargetChange(from, to) {
      console.log({ from, to });
    },
  });
});
*/
