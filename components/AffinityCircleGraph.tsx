"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import * as d3 from "d3"
import type { CircleData } from "@/lib/lens"
import { proxied, initial } from "@/lib/image"

interface SimNode {
  id: string
  handle: string
  name: string | null
  avatarUrl: string | null
  address: string | null
  count: number
  radius: number
  isCenter: boolean
  fill1: string
  fill2: string
  ring: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

interface HoverInfo {
  handle: string
  count: number
  x: number
  y: number
}

interface Props {
  data: CircleData
  /** Clamped square size in px for the SVG (also the simulation space). */
  size: number
}

/**
 * The Circle of Affinity — a D3 force-directed graph.
 *
 * Center = the queried account (fixed). Friends orbit via a radial force, sized
 * by affinity (log-scaled mention count) and tinted along a violet→cyan ramp by
 * rank. Physics: charge repulsion, collision, plus live mouse-repulsion and
 * drag. Clicking a friend dives into *their* circle.
 */
export function AffinityCircleGraph({ data, size }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()
  const [hover, setHover] = useState<HoverInfo | null>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const width = size
    const height = size
    const scale = width / 800

    // ── Radii ────────────────────────────────────────────────────────────
    const centerRadius = Math.max(38, width * 0.11)
    const minRadius = Math.max(12, width * 0.03)
    const maxRadius = Math.max(24, width * 0.072)

    const friends = data.friends
    const counts = friends.map((f) => f.count)
    const maxCount = Math.max(1, ...counts)
    const minCount = Math.min(...counts, 1)

    const radiusFor = (count: number) => {
      if (maxCount === minCount) return (minRadius + maxRadius) / 2
      const t = Math.log(count + 1) / Math.log(maxCount + 1)
      return minRadius + t * (maxRadius - minRadius)
    }

    // ── Build nodes ──────────────────────────────────────────────────────
    const centerNode: SimNode = {
      id: "center",
      handle: data.profile.handle,
      name: data.profile.name,
      avatarUrl: data.profile.avatarUrl,
      address: data.profile.address,
      count: 0,
      radius: centerRadius,
      isCenter: true,
      fill1: "#fbbf24",
      fill2: "#fb7185",
      ring: "#fcd34d",
    }

    const friendNodes: SimNode[] = friends.map((f, i) => {
      const rank = friends.length > 1 ? i / (friends.length - 1) : 0
      const light = d3.interpolateRgb("#c4b5fd", "#67e8f9")(rank)
      const deep = d3.interpolateRgb("#7c3aed", "#0891b2")(rank)
      return {
        id: `f-${f.handle}`,
        handle: f.handle,
        name: f.name,
        avatarUrl: f.avatarUrl,
        address: f.address,
        count: f.count,
        radius: radiusFor(f.count),
        isCenter: false,
        fill1: light,
        fill2: deep,
        ring: light,
      }
    })

    const nodes = [centerNode, ...friendNodes]

    // ── SVG scaffolding ──────────────────────────────────────────────────
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("viewBox", `0 0 ${width} ${height}`)

    const defs = svg.append("defs")

    // Soft glow filter
    const glow = defs.append("filter").attr("id", "glow").attr("x", "-60%").attr("y", "-60%").attr("width", "220%").attr("height", "220%")
    glow.append("feGaussianBlur").attr("stdDeviation", 3.5 * scale).attr("result", "blur")
    const glowMerge = glow.append("feMerge")
    glowMerge.append("feMergeNode").attr("in", "blur")
    glowMerge.append("feMergeNode").attr("in", "SourceGraphic")

    // Per-node radial gradients
    nodes.forEach((n) => {
      const g = defs
        .append("radialGradient")
        .attr("id", `grad-${n.id}`)
        .attr("cx", "35%")
        .attr("cy", "30%")
        .attr("r", "75%")
      g.append("stop").attr("offset", "0%").attr("stop-color", n.fill1)
      g.append("stop").attr("offset", "100%").attr("stop-color", n.fill2)
    })

    const container = svg.append("g")

    // Decorative concentric orbit rings
    const orbits = container.append("g").attr("opacity", 0.5)
    ;[0.24, 0.36, 0.46].forEach((r) => {
      orbits
        .append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", width * r)
        .attr("fill", "none")
        .attr("stroke", "#2a2540")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2 6")
    })

    // ── Forces ───────────────────────────────────────────────────────────
    centerNode.fx = width / 2
    centerNode.fy = height / 2

    const radialDistance = width * 0.32
    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.06))
      .force("charge", d3.forceManyBody().strength(-260 * scale).distanceMax(360 * scale))
      .force(
        "collision",
        d3.forceCollide<SimNode>().radius((d) => d.radius + 7 * scale).strength(0.85)
      )
      .force(
        "radial",
        d3
          .forceRadial<SimNode>((d) => (d.isCenter ? 0 : radialDistance), width / 2, height / 2)
          .strength((d) => (d.isCenter ? 0 : 0.55))
      )
      .alphaDecay(0.025)

    // ── Links (center → friend) ──────────────────────────────────────────
    const links = container
      .append("g")
      .selectAll("line")
      .data(friendNodes)
      .join("line")
      .attr("stroke", (d) => d.ring)
      .attr("stroke-width", (d) => 0.6 + (d.count / maxCount) * 1.8)
      .attr("stroke-opacity", 0.18)

    // ── Node groups ──────────────────────────────────────────────────────
    const node = container
      .append("g")
      .selectAll<SVGGElement, SimNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", (d) => (d.isCenter ? "default" : "pointer"))

    // Base filled circle
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => `url(#grad-${d.id})`)
      .attr("stroke", (d) => d.ring)
      .attr("stroke-width", (d) => (d.isCenter ? 3 : 2))
      .attr("filter", (d) => (d.isCenter ? "url(#glow)" : null))
      .attr("opacity", 0.96)

    // Avatar (clipped) OR initial fallback
    node.each(function (d) {
      const g = d3.select(this)
      const src = proxied(d.avatarUrl)
      if (src) {
        const clipId = `clip-${d.id}`
        defs.append("clipPath").attr("id", clipId).append("circle").attr("r", d.radius - 2.5)
        g.append("image")
          .attr("href", src)
          .attr("crossorigin", "anonymous")
          .attr("width", d.radius * 2)
          .attr("height", d.radius * 2)
          .attr("x", -d.radius)
          .attr("y", -d.radius)
          .attr("preserveAspectRatio", "xMidYMid slice")
          .attr("clip-path", `url(#${clipId})`)
          .attr("opacity", 0)
          .transition()
          .duration(700)
          .attr("opacity", 1)
      } else {
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", d.radius * 0.9)
          .attr("font-weight", 700)
          .attr("fill", "#0c0a17")
          .attr("pointer-events", "none")
          .text(initial(d.handle))
      }
    })

    // Labels below nodes (kept for the exported PNG, hidden on tiny friends)
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", (d) => d.radius + (d.isCenter ? 20 : 14))
      .attr("font-size", (d) => (d.isCenter ? 13 : 11))
      .attr("font-weight", (d) => (d.isCenter ? 700 : 500))
      .attr("fill", (d) => (d.isCenter ? "#fcd34d" : "#c4bfe0"))
      .attr("pointer-events", "none")
      .attr("opacity", (d) => (d.isCenter || d.radius > minRadius * 1.15 ? 1 : 0))
      .text((d) => {
        const h = d.handle
        return h.length > 14 ? h.slice(0, 12) + "…" : h
      })

    // ── Interactions ─────────────────────────────────────────────────────
    const svgRect = () => svgRef.current!.getBoundingClientRect()

    node
      .filter((d) => !d.isCenter)
      .on("mouseenter", function (_e, d) {
        d3.select(this).select("circle").transition().duration(180).attr("r", d.radius * 1.16).attr("filter", "url(#glow)")
        d3.select(this).select("image").transition().duration(180)
          .attr("width", d.radius * 2 * 1.16).attr("height", d.radius * 2 * 1.16)
          .attr("x", -d.radius * 1.16).attr("y", -d.radius * 1.16)
      })
      .on("mousemove", function (event, d) {
        const rect = svgRect()
        const [px, py] = d3.pointer(event, svgRef.current)
        setHover({
          handle: d.handle,
          count: d.count,
          x: (px / width) * rect.width,
          y: (py / height) * rect.height,
        })
      })
      .on("mouseleave", function (_e, d) {
        d3.select(this).select("circle").transition().duration(180).attr("r", d.radius).attr("filter", null)
        d3.select(this).select("image").transition().duration(180)
          .attr("width", d.radius * 2).attr("height", d.radius * 2)
          .attr("x", -d.radius).attr("y", -d.radius)
        setHover(null)
      })
      .on("click", function (_e, d) {
        setHover(null)
        router.push(`/circle/${encodeURIComponent(d.handle)}`)
      })

    // Drag (friends only)
    const drag = d3
      .drag<SVGGElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        if (!d.isCenter) {
          d.fx = d.x
          d.fy = d.y
        }
      })
      .on("drag", (event, d) => {
        if (!d.isCenter) {
          d.fx = event.x
          d.fy = event.y
        }
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        if (!d.isCenter) {
          d.fx = null
          d.fy = null
        }
      })
    node.filter((d) => !d.isCenter).call(drag)

    // Mouse repulsion
    const repulseR = 130 * scale
    const repulseS = 70 * scale
    svg.on("mousemove", function (event) {
      const [mx, my] = d3.pointer(event)
      nodes.forEach((n) => {
        if (n.isCenter || n.x == null || n.y == null) return
        const dx = n.x - mx
        const dy = n.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < repulseR && dist > 0) {
          const f = (repulseR - dist) / repulseR
          if (n.vx != null && n.vy != null) {
            n.vx += (dx / dist) * f * repulseS
            n.vy += (dy / dist) * f * repulseS
          }
        }
      })
      simulation.alpha(0.12).restart()
    })

    // ── Tick ─────────────────────────────────────────────────────────────
    simulation.on("tick", () => {
      links
        .attr("x1", width / 2)
        .attr("y1", height / 2)
        .attr("x2", (d) => d.x ?? width / 2)
        .attr("y2", (d) => d.y ?? height / 2)
      node.attr("transform", (d) => `translate(${d.x ?? width / 2},${d.y ?? height / 2})`)
    })

    return () => {
      simulation.stop()
    }
  }, [data, size, router])

  return (
    <div className="relative select-none" style={{ width: size, maxWidth: "100%" }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className="w-full h-auto touch-none"
        style={{ aspectRatio: "1 / 1" }}
      />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--color-border)] bg-[var(--color-abyss)]/95 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur"
          style={{ left: hover.x, top: hover.y - 12 }}
        >
          <span className="font-semibold text-[var(--color-ink)]">@{hover.handle}</span>
          <span className="ml-1.5 text-[var(--color-ink-muted)]">
            {hover.count} {hover.count === 1 ? "signal" : "signals"}
          </span>
        </div>
      )}
    </div>
  )
}
