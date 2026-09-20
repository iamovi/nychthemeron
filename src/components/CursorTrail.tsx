import { useEffect, useRef } from "react";
import { useTheme } from "./theme-provider";

class Point {
    x: number;
    y: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    velocityX: number;
    velocityY: number;

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.life = 1;
        this.maxLife = 25; // How many frames it lasts
        this.size = Math.random() * 5 + 2; 
        this.color = color;
        // Random drift
        this.velocityX = (Math.random() - 0.5) * 1.5;
        this.velocityY = (Math.random() - 0.5) * 1.5 + 0.5; // Slight drift down
    }

    update() {
        this.life++;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.size *= 0.92; // Shrink over time
    }

    draw(ctx: CanvasRenderingContext2D) {
        const opacity = Math.max(0, 1 - (this.life / this.maxLife));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.color}, ${opacity})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${this.color}, ${opacity})`;
        ctx.fill();
    }
}

export function CursorTrail() {
    const { cursorTrail } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2, moving: false });
    const colorRef = useRef<string>("270, 40%, 70%"); // Default HSL fallback format for Canvas

    useEffect(() => {
        // Disable entirely on mobile devices / touch screens to save battery
        const isMobile = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
        if (!cursorTrail || !canvasRef.current || isMobile) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener("resize", resize);

        let timeout: ReturnType<typeof setTimeout>;
        const onMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
            mouseRef.current.moving = true;
            
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                mouseRef.current.moving = false;
            }, 50);
        };
        window.addEventListener("mousemove", onMouseMove);

        // Fetch primary color periodically to stay in sync with animated color mode
        // Note: The CSS uses space-separated HSL (e.g. "270 30% 63%"). Canvas hsla() prefers commas.
        const updateColorFromCSSVar = () => {
            const rootStyle = getComputedStyle(document.documentElement);
            const rawHsl = rootStyle.getPropertyValue('--primary').trim();
            if (rawHsl) {
                // Replace spaces with commas to ensure cross-browser compatibility
                const commaFormat = rawHsl.replace(/\s+/g, ', ');
                colorRef.current = commaFormat;
            }
        };
        
        updateColorFromCSSVar(); // Initial pull
        const colorInterval = setInterval(updateColorFromCSSVar, 100); // 10fps poll is practically invisible for overhead

        let animationFrameId: number;
        let particles: Point[] = [];

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Generate particles while moving mouse
            if (mouseRef.current.moving) {
                particles.push(new Point(mouseRef.current.x, mouseRef.current.y, colorRef.current));
                particles.push(new Point(mouseRef.current.x + (Math.random() - 0.5) * 5, mouseRef.current.y + (Math.random() - 0.5) * 5, colorRef.current));
            } 

            // Update & Draw
            particles.forEach((p) => {
                p.update();
                p.draw(ctx);
            });

            // Cleanup dead
            particles = particles.filter(p => p.life < p.maxLife);

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMouseMove);
            clearInterval(colorInterval);
            clearTimeout(timeout);
            cancelAnimationFrame(animationFrameId);
        };
    }, [cursorTrail]);

    if (!cursorTrail) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[9999]"
        />
    );
}
