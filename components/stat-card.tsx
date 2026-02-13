import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: React.ReactNode;
    trend?: {
        value: string | number;
        label: string;
        positive?: boolean;
    };
    className?: string;
}

export function StatCard({
    title,
    value,
    description,
    icon,
    trend,
    className,
}: StatCardProps) {
    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon && (
                    <div className="h-4 w-4 text-muted-foreground">{icon}</div>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <p className="text-xs text-muted-foreground mt-1">
                        <span
                            className={cn(
                                'mr-1',
                                trend.positive
                                    ? 'text-green-500'
                                    : 'text-red-500'
                            )}
                        >
                            {trend.positive ? '+' : ''}
                            {trend.value}
                        </span>
                        {trend.label}
                    </p>
                )}
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
