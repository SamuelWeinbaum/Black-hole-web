class Planet {
    constructor(mass, radius, color, position, velocity=[0,0], acc=[0,0], force=[0,0]) {
        this.radius = radius;
        this.mass = Math.PI * (this.radius ** 2) * 3;
        this.color = color;
        this.x = position[0];
        this.y = position[1];
        this.v_x = velocity[0];
        this.v_y = velocity[1];
        this.acc_x = acc[0];
        this.acc_y = acc[1];
        this.force_x = force[0];
        this.force_y = force[1];
        this.controle = false;
        this.trail_dots = [];
        this.trail_length = 500;
        this.stay = false;
        this.glow_radius = radius * 1.8;
        this.show_info = true;
        this.info_start_time = performance.now();
        this.info_duration = 600000;
        this.collision_particles = [];
    }

    handleControls(keys) {
        if (this.controle) {
            if (keys['ArrowUp']) this.v_y -= 0.1;
            if (keys['ArrowDown']) this.v_y += 0.1;
            if (keys['ArrowLeft']) this.v_x -= 0.1;
            if (keys['ArrowRight']) this.v_x += 0.1;
            if (keys['u']) {
                this.radius += 1;
                this.mass = Math.PI * (this.radius ** 2) * 3;
                this.glow_radius = this.radius * 1.8;
                this.show_info = true;
                this.info_start_time = performance.now();
            }
            if (keys['d'] && this.radius > 5) {
                this.radius -= 1;
                this.mass = Math.PI * (this.radius ** 2) * 3;
                this.glow_radius = this.radius * 1.8;
                this.show_info = true;
                this.info_start_time = performance.now();
            }
            if (keys['s']) {
                this.stay = !this.stay;
            }
        }
    }

    update(planets) {
        if (!this.stay) {
            this.updateGravity(planets);
        }
        this.updateTrail();
        this.updateCollisionParticles();
    }

    updateGravity(planets) {
        this.force_x = 0;
        this.force_y = 0;
        const G = 0.3;

        planets.forEach(other => {
            if (other !== this) {
                const dx = (other.x - this.x) / 10;
                const dy = (other.y - this.y) / 10;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const force = (G * this.mass * other.mass) / (dist * dist);
                
                this.force_x += (dx / dist) * force / 360;
                this.force_y += (dy / dist) * force / 360;
            }
        });

        this.acc_x = this.force_x / this.mass;
        this.acc_y = this.force_y / this.mass;
        this.v_x += this.acc_x;
        this.v_y += this.acc_y;
        this.x += this.v_x;
        this.y += this.v_y;
    }

    draw(ctx) {
        // Draw trail
        this.trail_dots.forEach((dot, i) => {
            const alpha = (i / this.trail_dots.length) * 0.5;
            ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 1, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius,
            this.x, this.y, this.glow_radius
        );
        gradient.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.3)`);
        gradient.addColorStop(1, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.glow_radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw planet
        ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw info if selected
        if (this.controle && this.show_info) {
            this.drawInfo(ctx);
        }
    }

    updateTrail() {
        if (this.trail_dots.length > this.trail_length) {
            this.trail_dots.shift();
        }
        this.trail_dots.push({
            x: this.x,
            y: this.y
        });
    }

    drawInfo(ctx) {
        const info = [
            `Mass: ${Math.round(this.mass)}`,
            `Velocity: ${Math.round(Math.sqrt(this.v_x*this.v_x + this.v_y*this.v_y) * 100) / 100}`,
            `Stay: ${this.stay ? 'On' : 'Off'}`
        ];

        const padding = 10;
        const lineHeight = 20;
        const width = 200;
        const height = (info.length + 1) * lineHeight + padding * 2;
        const x = this.x + this.radius + 20;
        const y = this.y - height/2;

        // Draw info box background
        ctx.fillStyle = 'white';
        ctx.shadowColor = SHADOW_COLOR;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw text
        ctx.fillStyle = UI_COLOR;
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        info.forEach((text, i) => {
            ctx.fillText(text, x + padding, y + padding + (i + 1) * lineHeight);
        });

        // Draw close button
        const closeX = x + width - 30;
        const closeY = y + 10;
        ctx.fillStyle = UI_COLOR;
        ctx.font = 'bold 16px Arial';
        ctx.fillText('×', closeX, closeY + 10);
    }

    createCollisionEffect() {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.collision_particles.push(
                new Particle(
                    this.x, this.y, vx, vy, 
                    Math.random() * 2 + 2,
                    this.color,
                    60
                )
            );
        }
    }

    updateCollisionParticles() {
        this.collision_particles = this.collision_particles.filter(p => !p.dead);
        this.collision_particles.forEach(p => p.update());
    }
}
