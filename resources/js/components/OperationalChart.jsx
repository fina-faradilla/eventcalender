import React from 'react';

export default function OperationalChart({ series }) {
    const width = 760, height = 280, padX = 44, padY = 28;
    const max = Math.max(1, ...series.map(item => item.value));
    const x = index => padX + index * ((width - padX * 2) / Math.max(1, series.length - 1));
    const y = value => height - padY - (value / max) * (height - padY * 2);
    const points = series.map((item, index) => `${x(index)},${y(item.value)}`).join(' ');
    const area = `${padX},${height-padY} ${points} ${x(series.length-1)},${height-padY}`;
    return <div className="operational-chart" role="img" aria-label="Acara dikelompokkan berdasarkan bulan">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {[0,.25,.5,.75,1].map(step => <line key={step} x1={padX} x2={width-padX} y1={y(max*step)} y2={y(max*step)} className="chart-gridline"/>)}
            <polygon points={area} className="chart-area"/>
            <polyline points={points} className="chart-line"/>
            {series.map((item,index) => <circle key={item.key} cx={x(index)} cy={y(item.value)} r="4" className="chart-point"/>)}
        </svg>
        <div className="chart-labels">{series.map(item => <span key={item.key}>{item.label}</span>)}</div>
    </div>;
}
