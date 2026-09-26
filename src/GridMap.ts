import { fromEvent, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GameStateData } from './types';
import { CELL_SIZE, GRID_SIZE } from './config';

export class GridMap {
  private ctx: CanvasRenderingContext2D;
  public cellClick$: Observable<{ x: number; y: number }>;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;

    // Stream of canvas grid cell clicks
    this.cellClick$ = fromEvent<MouseEvent>(this.canvas, 'click').pipe(
      map(event => {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        return {
          x: Math.floor(clickX / CELL_SIZE),
          y: Math.floor(clickY / CELL_SIZE)
        };
      })
    );
  }

  public render(state: GameStateData) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render cells
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const cell = state.grid[x][y];
        const posX = x * CELL_SIZE;
        const posY = y * CELL_SIZE;

        // Draw Cell Background
        this.ctx.fillStyle = cell.module ? cell.module.color : '#161f30';
        this.ctx.fillRect(posX, posY, CELL_SIZE, CELL_SIZE);

        // Draw Cell Grid Outline
        this.ctx.strokeStyle = '#2a3447';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(posX, posY, CELL_SIZE, CELL_SIZE);

        // Draw Text Identifier inside placed module
        if (cell.module) {
          this.ctx.fillStyle = '#000000';
          this.ctx.font = 'bold 10px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(cell.module.type, posX + CELL_SIZE / 2, posY + CELL_SIZE / 2 + 3);
        }
      }
    }
  }
}