import { useMemo } from 'react';

interface Props {
    label: string;
    value: string;
    onChange: (val: string) => void;
    maxLength?: number;
    required?: boolean;
}

export default function InputText({ label, value, onChange, maxLength, required }: Props) {
    const count = useMemo(() => value?.length ?? 0, [value]);

    return (
        <div>
            <label className="block mb-2 text-sm font-medium">
                {label} {required && <span className="text-red-600">*</span>}
            </label>
            <input
                type="text"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                maxLength={maxLength}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            {maxLength !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                    {count}/{maxLength}
                </p>
            )}
        </div>
    );
}
