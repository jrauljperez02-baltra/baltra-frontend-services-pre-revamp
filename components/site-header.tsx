import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PlusIcon } from 'lucide-react';
import { BaltraLogo } from './baltra-logo';
import { ModeToggle } from './mode-toggle';
import { StoreIndicator } from './store-indicator';
import { Button } from './ui/button';

export function SiteHeader({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: {
        label: string;
        icon?: React.ReactNode;
        onClick?: () => void;
    };
}) {
    return (
        <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-20 flex h-20 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <div className="flex w-full items-center gap-1 lg:gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mx-2 data-[orientation=vertical]:h-4"
                    />
                    <BaltraLogo className="h-6 w-6 sm:h-8 sm:w-8 text-primary hidden sm:block" />
                    <div>
                        <h1 className="text-lg font-medium">{title}</h1>
                        <p className="text-base text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {action && (
                        <Button
                            size="sm"
                            className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                            {action.icon || (
                                <PlusIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                            <span className="truncate">{action.label}</span>
                        </Button>
                    )}
                    <StoreIndicator />
                    <ModeToggle />
                </div>
            </div>
        </header>
    );
}
