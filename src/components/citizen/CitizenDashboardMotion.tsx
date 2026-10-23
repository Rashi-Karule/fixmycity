'use client';

import React, { useEffect, useRef } from 'react';

/**
 * CitizenDashboardMotion — Scoped solely to /citizen/dashboard
 * Renders an original, lightweight, interactive network of civic connectivity nodes
 * with flowing route lines and gentle ambient light movement.
 *
 * Accessibility & Performance:
 * - Automatically respects `prefers-reduced-motion` by rendering a static network frame
 * - Pauses execution when tab is inactive (`visibilitychange`)
 * - Cleaned up completely on unmount without memory leaks
 */
export default function CitizenDashboardMotion() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 480);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      initNodes();
    };

    window.addEventListener('resize', handleResize);

    // Node definitions for civic connectivity
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      pulseOffset: number;
    }

    interface Packet {
      fromIdx: number;
      toIdx: number;
      progress: number;
      speed: number;
      color: string;
    }

    let nodes: Node[] = [];
    let packets: Packet[] = [];
    const NODE_COUNT = Math.min(36, Math.floor(width / 35));

    const colors = [
      'rgba(56, 189, 248, 0.75)', // Sky / Dispatch blue
      'rgba(245, 158, 11, 0.75)', // Amber / SLA active
      'rgba(16, 185, 129, 0.75)', // Emerald / Resolved
      'rgba(168, 85, 247, 0.65)', // Purple / Executive
    ];

    function initNodes() {
      nodes = [];
      packets = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 2 + 1.8,
          color: colors[i % colors.length],
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    initNodes();

    let time = 0;

    function drawStatic() {
      if (!ctx) return;
      // Dark layered navy background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#091527');
      bgGrad.addColorStop(0.5, '#10233d');
      bgGrad.addColorStop(1, '#0c1b30');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw faint connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((node) => {
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (prefersReducedMotion) {
      drawStatic();
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    // Animation Loop
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      time += 0.015;

      // Dark layered navy background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#081426');
      bgGrad.addColorStop(0.5, '#0f223a');
      bgGrad.addColorStop(1, '#0a192e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient light movement
      const lightX = width * 0.7 + Math.sin(time * 0.5) * 80;
      const lightY = height * 0.35 + Math.cos(time * 0.4) * 50;
      const lightGrad = ctx.createRadialGradient(lightX, lightY, 10, lightX, lightY, width * 0.45);
      lightGrad.addColorStop(0, 'rgba(224, 123, 46, 0.08)'); // FixMyCity orange glow
      lightGrad.addColorStop(0.6, 'rgba(37, 99, 235, 0.05)'); // Civic blue
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, width, height);

      // Update and draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = 0.22 * (1 - dist / 150);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();

            // Randomly dispatch a civic packet between nodes
            if (packets.length < 8 && Math.random() < 0.003) {
              packets.push({
                fromIdx: i,
                toIdx: j,
                progress: 0,
                speed: 0.012 + Math.random() * 0.015,
                color: Math.random() > 0.5 ? '#E07B2E' : '#38bdf8',
              });
            }
          }
        }
      }

      // Draw and update active packets (simulating live complaint routing dispatch)
      for (let p = packets.length - 1; p >= 0; p--) {
        const pkt = packets[p];
        const from = nodes[pkt.fromIdx];
        const to = nodes[pkt.toIdx];
        if (!from || !to) {
          packets.splice(p, 1);
          continue;
        }

        pkt.progress += pkt.speed;
        if (pkt.progress >= 1) {
          packets.splice(p, 1);
          continue;
        }

        const px = from.x + (to.x - from.x) * pkt.progress;
        const py = from.y + (to.y - from.y) * pkt.progress;

        ctx.fillStyle = pkt.color;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Trailing glow
        ctx.fillStyle = `${pkt.color}40`;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Soft bounce at edges
        if (node.x < 10 || node.x > width - 10) node.vx *= -1;
        if (node.y < 10 || node.y > height - 10) node.vy *= -1;

        const pulse = 1 + Math.sin(time * 2 + node.pulseOffset) * 0.25;

        // Halo
        ctx.fillStyle = `${node.color.replace('0.75', '0.15').replace('0.65', '0.12')}`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, (node.radius + 3) * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Core node
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    // Pause on hidden tab to save battery and GPU
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        isRunning = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="citizen-dashboard-motion absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ filter: 'contrast(1.05)' }}
      />
      {/* Subtle vignette layer to ensure crisp foreground contrast */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#091527]/40 to-[#091527]/90 pointer-events-none" />
    </div>
  );
}
