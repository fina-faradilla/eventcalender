import React, { useState } from 'react';
import { Calendar, Users } from 'lucide-react';

export default function OperationalChart({ series }) {
    if (!series || !series.length) {
        return null;
    }

    const [selectedIndex, setSelectedIndex] = useState(null);
    const selectedItem = selectedIndex !== null ? (series[selectedIndex] ?? null) : null;


    const width = 760;
    const height = 240;
    const padX = 44;
    const padY = 24;

    const maxEvents = Math.max(1, ...series.map(item => item.events ?? item.value ?? 0));
    const maxParticipants = Math.max(1, ...series.map(item => item.participants ?? 0));

    const x = index => padX + index * ((width - padX * 2) / Math.max(1, series.length - 1));
    const yEvents = value => (height - padY) - (value / maxEvents) * (height - padY * 2);
    const yParticipants = value => (height - padY) - (value / maxParticipants) * (height - padY * 2);

    const eventPoints = series.map((item, index) => `${x(index)},${yEvents(item.events ?? item.value ?? 0)}`).join(' ');
    const eventArea = `${padX},${height - padY} ${eventPoints} ${x(series.length - 1)},${height - padY}`;

    const participantPoints = series.map((item, index) => `${x(index)},${yParticipants(item.participants ?? 0)}`).join(' ');
    const participantArea = `${padX},${height - padY} ${participantPoints} ${x(series.length - 1)},${height - padY}`;

    return (
        <div className="operational-chart" role="img" aria-label="Grafik volume acara dan total pengunjung bulanan">
            {/* Chart Legend */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-full bg-[#9E0A2B]" />
                        <span className="font-semibold text-ink">Volume Acara</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-full bg-[#0284c7]" />
                        <span className="font-semibold text-ink">Total Pengunjung</span>
                    </span>
                </div>
                <span className="text-neutral text-[11px]">Klik titik/bulan untuk melihat detail</span>
            </div>

            {/* SVG Dual-line Chart */}
            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg w-full overflow-visible">
                    <defs>
                        <linearGradient id="eventGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#9E0A2B" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#9E0A2B" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="participantGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(step => (
                        <line
                            key={step}
                            x1={padX}
                            x2={width - padX}
                            y1={(height - padY) - step * (height - padY * 2)}
                            y2={(height - padY) - step * (height - padY * 2)}
                            className="chart-gridline"
                        />
                    ))}

                    {/* Selected Month Guideline */}
                    {selectedIndex !== null && (
                        <line
                            x1={x(selectedIndex)}
                            x2={x(selectedIndex)}
                            y1={padY}
                            y2={height - padY}
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                        />
                    )}

                    {/* Shaded Area Gradients */}
                    <polygon points={eventArea} fill="url(#eventGrad)" />
                    <polygon points={participantArea} fill="url(#participantGrad)" />

                    {/* Event Line (Red) */}
                    <polyline
                        points={eventPoints}
                        fill="none"
                        stroke="#9E0A2B"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Participant Line (Blue) */}
                    <polyline
                        points={participantPoints}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Points & Hitboxes */}
                    {series.map((item, index) => {
                        const cx = x(index);
                        const cyEvt = yEvents(item.events ?? item.value ?? 0);
                        const cyPart = yParticipants(item.participants ?? 0);
                        const isSelected = selectedIndex === index;

                        return (
                            <g key={item.key} className="cursor-pointer" onClick={() => setSelectedIndex(index)}>
                                <rect
                                    x={cx - 24}
                                    y={0}
                                    width={48}
                                    height={height}
                                    fill="transparent"
                                />

                                {/* Event Point */}
                                <circle
                                    cx={cx}
                                    cy={cyEvt}
                                    r={isSelected ? 6 : 4}
                                    fill={isSelected ? '#9E0A2B' : '#ffffff'}
                                    stroke="#9E0A2B"
                                    strokeWidth={isSelected ? 3 : 2}
                                />

                                {/* Participant Point */}
                                <circle
                                    cx={cx}
                                    cy={cyPart}
                                    r={isSelected ? 6 : 4}
                                    fill={isSelected ? '#0284c7' : '#ffffff'}
                                    stroke="#0284c7"
                                    strokeWidth={isSelected ? 3 : 2}
                                />
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* X-Axis Month Labels */}
            <div className="chart-labels mt-2">
                {series.map((item, index) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        className={`text-center py-1 rounded transition-colors text-xs ${
                            selectedIndex === index ? 'font-bold text-brand bg-brand-soft/40' : 'hover:text-ink text-neutral'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Selected Month Detail — compact inline bar */}
            {selectedItem && (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-canvas/70 px-4 py-3">
                    <div className="flex items-center gap-1.5 text-brand">
                        <Calendar size={14} />
                        <span className="text-xs font-bold text-ink">
                            {selectedItem.fullLabel || selectedItem.label}
                        </span>
                    </div>
                    <span className="h-4 w-px bg-line hidden sm:block" />
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-brand text-white font-bold text-[9px]">EVT</span>
                        <span className="text-xs font-semibold text-ink">{(selectedItem.events ?? selectedItem.value ?? 0).toLocaleString('id-ID')} Acara</span>
                    </div>
                    <span className="h-4 w-px bg-line hidden sm:block" />
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#0284c7] text-white">
                            <Users size={11} />
                        </span>
                        <span className="text-xs font-semibold text-ink">{(selectedItem.participants ?? 0).toLocaleString('id-ID')} Pengunjung</span>
                    </div>
                </div>
            )}
        </div>
    );
}
