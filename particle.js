class Particle {
    constructor(x, y, vx, vy, radius, color, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.dead = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime -= 1;
        
        if (this.lifetime <= 0) {
            this.dead = true;
        }
    }

    draw(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
