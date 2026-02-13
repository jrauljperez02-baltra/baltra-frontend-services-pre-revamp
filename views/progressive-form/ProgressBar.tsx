interface Props {
    current: number;
    total: number;
}

export default function ProgressBar({ current, total }: Props) {
    const width = total > 0 ? ((current + 1) / total) * 100 : 0;
    return (
        <div className="w-full bg-gray-200 h-2 mb-4 rounded-full overflow-hidden">
            <div className="bg-baltra-600 h-full transition-all duration-300" style={{ width: `${width}%` }} />
        </div>
    );
}