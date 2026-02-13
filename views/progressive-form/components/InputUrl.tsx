import { useEffect, useState } from 'react';

interface Props {
    label: string;
    value: string;
    onChange: (val: string) => void;
    required?: boolean;
}

function looksLikeUrl(v: string) {
    if (!v) return true;
    try {
        const u = new URL(v);
        return !!u.protocol && !!u.host;
    } catch {
        return false;
    }
}

export default function InputUrl({ label, value, onChange, required }: Props) {
    const [touched, setTouched] = useState(false);
    const [valid, setValid] = useState(true);

    useEffect(() => {
        setValid(looksLikeUrl(value));
    }, [value]);

    return (
        <div>
            <label className="block mb-2 text-sm font-medium">
                {label} {required && <span className="text-red-600">*</span>}
            </label>
            <input
                type="url"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="https://ejemplo.com"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 ${!valid && touched ? 'border-red-500' : 'border-gray-300'
                    }`}
            />
            {!valid && touched && (
                <p className="text-xs text-red-600 mt-1">Introduce una URL válida (e.g., https://tuweb.com)</p>
            )}
        </div>
    );
}
